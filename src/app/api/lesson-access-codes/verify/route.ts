import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonAccessCodes, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, studentId } = body;

    // Validate required fields
    if (!code) {
      return NextResponse.json({ 
        error: "Code is required",
        code: "MISSING_CODE" 
      }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ 
        error: "Student ID is required",
        code: "MISSING_STUDENT_ID" 
      }, { status: 400 });
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase();

    // Validate studentId is valid integer
    if (isNaN(parseInt(studentId.toString()))) {
      return NextResponse.json({ 
        error: "Valid student ID is required",
        code: "INVALID_STUDENT_ID" 
      }, { status: 400 });
    }

    const parsedStudentId = parseInt(studentId.toString());

    // Validate student exists and has role='student'
    const student = await db.select()
      .from(users)
      .where(eq(users.id, parsedStudentId))
      .limit(1);

    if (student.length === 0 || student[0].role !== 'student') {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid student' 
      }, { status: 200 });
    }

    // Find code in database
    const accessCode = await db.select()
      .from(lessonAccessCodes)
      .where(eq(lessonAccessCodes.code, normalizedCode))
      .limit(1);

    // Check if code exists
    if (accessCode.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid code' 
      }, { status: 200 });
    }

    const codeRecord = accessCode[0];

    // Check if code is already used
    if (codeRecord.used) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Code already used' 
      }, { status: 200 });
    }

    // Check if code is expired
    if (codeRecord.expiresAt) {
      const expiryDate = new Date(codeRecord.expiresAt);
      const currentDate = new Date();
      
      if (currentDate > expiryDate) {
        return NextResponse.json({ 
          valid: false, 
          error: 'Code expired' 
        }, { status: 200 });
      }
    }

    // Code is valid - update it
    const updatedCode = await db.update(lessonAccessCodes)
      .set({
        used: true,
        studentId: parsedStudentId
      })
      .where(eq(lessonAccessCodes.id, codeRecord.id))
      .returning();

    // Return success response
    return NextResponse.json({
      valid: true,
      code: updatedCode[0],
      lessonId: updatedCode[0].lessonId
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}