import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, teacherAccessCodes, centerAccessCodes, secretaryAccessCodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const VALID_ROLES = ['student', 'teacher', 'owner', 'secretary'];
const VALID_GRADES = [
  '4-primary',
  '5-primary',
  '6-primary',
  '1-preparatory',
  '2-preparatory',
  '3-preparatory',
  '1-secondary',
  '2-secondary',
  '3-secondary'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name, role, grade, accessCode, centerName, groupName, ownerName } = body;

    // Validate required fields
    if (!phone) {
      return NextResponse.json({
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({
        error: 'Name is required',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({
        error: 'Role is required',
        code: 'MISSING_ROLE'
      }, { status: 400 });
    }

    // Validate role value
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({
        error: 'Invalid role. Must be one of: student, teacher, owner, secretary',
        code: 'INVALID_ROLE'
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long',
        code: 'PASSWORD_TOO_SHORT'
      }, { status: 400 });
    }

    // Sanitize inputs
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    // Check if phone already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.phone, trimmedPhone))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        error: 'Phone number already registered',
        code: 'PHONE_EXISTS'
      }, { status: 400 });
    }

    // Role-specific validation
    if (role === 'student') {
      // Validate grade is provided and valid for students
      if (!grade) {
        return NextResponse.json({
          error: 'Grade is required for student registration',
          code: 'MISSING_GRADE'
        }, { status: 400 });
      }

      if (!VALID_GRADES.includes(grade)) {
        return NextResponse.json({
          error: 'Invalid grade value',
          code: 'INVALID_GRADE'
        }, { status: 400 });
      }
    }

    let teacherIdForSecretary: number | null = null;

    if (role === 'teacher') {
      // Validate access code is provided
      if (!accessCode) {
        return NextResponse.json({
          error: 'Access code is required for teacher registration',
          code: 'MISSING_ACCESS_CODE'
        }, { status: 400 });
      }

      // Check if it's a teacher access code or center access code
      const trimmedCode = accessCode.trim();
      
      // Try teacher access code first
      const validTeacherCode = await db.select()
        .from(teacherAccessCodes)
        .where(and(
          eq(teacherAccessCodes.code, trimmedCode),
          eq(teacherAccessCodes.used, false)
        ))
        .limit(1);

      // Try center access code if teacher code not found
      const validCenterCode = await db.select()
        .from(centerAccessCodes)
        .where(and(
          eq(centerAccessCodes.code, trimmedCode.toUpperCase()),
          eq(centerAccessCodes.used, false)
        ))
        .limit(1);

      if (validTeacherCode.length === 0 && validCenterCode.length === 0) {
        return NextResponse.json({
          error: 'Invalid or already used access code',
          code: 'INVALID_ACCESS_CODE'
        }, { status: 400 });
      }
    }

    if (role === 'secretary') {
      // Validate access code is provided
      if (!accessCode) {
        return NextResponse.json({
          error: 'Access code is required for secretary registration',
          code: 'MISSING_ACCESS_CODE'
        }, { status: 400 });
      }

      const trimmedCode = accessCode.trim().toUpperCase();

      // Check secretary access code
      const validSecretaryCode = await db.select()
        .from(secretaryAccessCodes)
        .where(and(
          eq(secretaryAccessCodes.code, trimmedCode),
          eq(secretaryAccessCodes.used, false)
        ))
        .limit(1);

      if (validSecretaryCode.length === 0) {
        return NextResponse.json({
          error: 'Invalid or already used access code',
          code: 'INVALID_ACCESS_CODE'
        }, { status: 400 });
      }

      teacherIdForSecretary = validSecretaryCode[0].teacherId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data based on role
    const userData: any = {
      phone: trimmedPhone,
      password: hashedPassword,
      name: trimmedName,
      role: role,
      createdAt: new Date().toISOString()
    };

    // Set grade field
    if (role === 'student') {
      userData.grade = grade;
    } else {
      userData.grade = null;
    }

    // Set centerName and groupName for teachers
    if (role === 'teacher') {
      userData.centerName = centerName ? centerName.trim() : null;
      userData.groupName = groupName ? groupName.trim() : null;
    }

    // Set teacherId for secretary
    if (role === 'secretary' && teacherIdForSecretary) {
      userData.teacherId = teacherIdForSecretary;
    }

    // Set centerName for owner (center registration)
    if (role === 'owner') {
      userData.centerName = centerName ? centerName.trim() : null;
    }

    // Create user
    const newUser = await db.insert(users)
      .values(userData)
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json({
        error: 'Failed to create user',
        code: 'USER_CREATION_FAILED'
      }, { status: 500 });
    }

    const createdUser = newUser[0];

    // If teacher, update access code
    if (role === 'teacher' && accessCode) {
      const trimmedCode = accessCode.trim();
      
      // Check teacher access code
      const validTeacherCode = await db.select()
        .from(teacherAccessCodes)
        .where(and(
          eq(teacherAccessCodes.code, trimmedCode),
          eq(teacherAccessCodes.used, false)
        ))
        .limit(1);

      if (validTeacherCode.length > 0) {
        await db.update(teacherAccessCodes)
          .set({
            used: true,
            usedByUserId: createdUser.id
          })
          .where(eq(teacherAccessCodes.id, validTeacherCode[0].id));
      } else {
        // Check center access code
        const validCenterCode = await db.select()
          .from(centerAccessCodes)
          .where(and(
            eq(centerAccessCodes.code, trimmedCode.toUpperCase()),
            eq(centerAccessCodes.used, false)
          ))
          .limit(1);

        if (validCenterCode.length > 0) {
          await db.update(centerAccessCodes)
            .set({
              used: true,
              usedByUserId: createdUser.id
            })
            .where(eq(centerAccessCodes.id, validCenterCode[0].id));
        }
      }
    }

    // If secretary, update access code
    if (role === 'secretary' && accessCode) {
      const trimmedCode = accessCode.trim().toUpperCase();
      
      const validSecretaryCode = await db.select()
        .from(secretaryAccessCodes)
        .where(eq(secretaryAccessCodes.code, trimmedCode))
        .limit(1);

      if (validSecretaryCode.length > 0) {
        await db.update(secretaryAccessCodes)
          .set({
            used: true,
            usedByUserId: createdUser.id
          })
          .where(eq(secretaryAccessCodes.id, validSecretaryCode[0].id));
      }
    }

    // Prepare response without password
    const userResponse: any = {
      id: createdUser.id,
      phone: createdUser.phone,
      role: createdUser.role,
      grade: createdUser.grade,
      name: createdUser.name,
      centerName: createdUser.centerName,
      groupName: createdUser.groupName,
      teacherId: createdUser.teacherId,
      createdAt: createdUser.createdAt
    };

    // For teacher registration, include access code info
    if (role === 'teacher' && accessCode) {
      const trimmedCode = accessCode.trim();
      
      const teacherCodeInfo = await db.select()
        .from(teacherAccessCodes)
        .where(eq(teacherAccessCodes.code, trimmedCode))
        .limit(1);

      if (teacherCodeInfo.length > 0) {
        userResponse.accessCodeInfo = {
          code: teacherCodeInfo[0].code,
          teacherName: teacherCodeInfo[0].teacherName
        };
      } else {
        const centerCodeInfo = await db.select()
          .from(centerAccessCodes)
          .where(eq(centerAccessCodes.code, trimmedCode.toUpperCase()))
          .limit(1);

        if (centerCodeInfo.length > 0) {
          userResponse.accessCodeInfo = {
            code: centerCodeInfo[0].code,
            centerName: centerCodeInfo[0].centerName
          };
        }
      }
    }

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}