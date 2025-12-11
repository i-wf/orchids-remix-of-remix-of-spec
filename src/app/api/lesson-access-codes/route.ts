import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonAccessCodes, users, lessons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');
    const lessonId = searchParams.get('lessonId');
    const used = searchParams.get('used');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(lessonAccessCodes)
        .where(eq(lessonAccessCodes.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters
    let query = db.select().from(lessonAccessCodes);
    const conditions = [];

    // Validate and filter by teacherId
    if (teacherId) {
      if (isNaN(parseInt(teacherId))) {
        return NextResponse.json(
          { error: 'Valid teacherId is required', code: 'INVALID_TEACHER_ID' },
          { status: 400 }
        );
      }

      const teacher = await db
        .select()
        .from(users)
        .where(and(eq(users.id, parseInt(teacherId)), eq(users.role, 'teacher')))
        .limit(1);

      if (teacher.length === 0) {
        return NextResponse.json(
          { error: 'Teacher not found or invalid role', code: 'TEACHER_NOT_FOUND' },
          { status: 400 }
        );
      }

      conditions.push(eq(lessonAccessCodes.teacherId, parseInt(teacherId)));
    }

    // Validate and filter by lessonId
    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'Valid lessonId is required', code: 'INVALID_LESSON_ID' },
          { status: 400 }
        );
      }

      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, parseInt(lessonId)))
        .limit(1);

      if (lesson.length === 0) {
        return NextResponse.json(
          { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
          { status: 400 }
        );
      }

      conditions.push(eq(lessonAccessCodes.lessonId, parseInt(lessonId)));
    }

    // Filter by used status
    if (used !== null && used !== undefined) {
      const usedBoolean = used === 'true';
      conditions.push(eq(lessonAccessCodes.used, usedBoolean));
    }

    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination and ordering
    const results = await query
      .orderBy(desc(lessonAccessCodes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, lessonId, teacherId, expiresAt } = body;

    // Validate required fields
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { error: 'Valid code is required', code: 'INVALID_CODE' },
        { status: 400 }
      );
    }

    if (!lessonId || isNaN(parseInt(lessonId))) {
      return NextResponse.json(
        { error: 'Valid lessonId is required', code: 'INVALID_LESSON_ID' },
        { status: 400 }
      );
    }

    if (!teacherId || isNaN(parseInt(teacherId))) {
      return NextResponse.json(
        { error: 'Valid teacherId is required', code: 'INVALID_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Validate teacherId exists and has role='teacher'
    const teacher = await db
      .select()
      .from(users)
      .where(and(eq(users.id, parseInt(teacherId)), eq(users.role, 'teacher')))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found or invalid role', code: 'TEACHER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate lessonId exists
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId)))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check if code is unique
    const existingCode = await db
      .select()
      .from(lessonAccessCodes)
      .where(eq(lessonAccessCodes.code, code.trim()))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json(
        { error: 'Code already exists', code: 'CODE_EXISTS' },
        { status: 400 }
      );
    }

    // Validate expiresAt if provided
    if (expiresAt !== undefined && expiresAt !== null) {
      const expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt timestamp', code: 'INVALID_EXPIRES_AT' },
          { status: 400 }
        );
      }
    }

    // Create new access code
    const newRecord = await db
      .insert(lessonAccessCodes)
      .values({
        code: code.trim(),
        lessonId: parseInt(lessonId),
        teacherId: parseInt(teacherId),
        used: false,
        expiresAt: expiresAt || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { expiresAt } = body;

    // Check for disallowed fields
    const disallowedFields = ['code', 'lessonId', 'teacherId', 'used', 'studentId'];
    const providedDisallowedFields = disallowedFields.filter(field => field in body);
    
    if (providedDisallowedFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot update fields: ${providedDisallowedFields.join(', ')}. Only expiresAt can be updated.`,
          code: 'FIELD_NOT_ALLOWED'
        },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(lessonAccessCodes)
      .where(eq(lessonAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate expiresAt if provided
    if (expiresAt !== undefined && expiresAt !== null) {
      const expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiresAt timestamp', code: 'INVALID_EXPIRES_AT' },
          { status: 400 }
        );
      }
    }

    // Update record
    const updated = await db
      .update(lessonAccessCodes)
      .set({
        expiresAt: expiresAt || null,
      })
      .where(eq(lessonAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(lessonAccessCodes)
      .where(eq(lessonAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if code is used
    if (existingRecord[0].used) {
      return NextResponse.json(
        { error: 'Cannot delete used access code', code: 'CODE_ALREADY_USED' },
        { status: 400 }
      );
    }

    // Delete record
    const deleted = await db
      .delete(lessonAccessCodes)
      .where(eq(lessonAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Access code deleted successfully',
        deletedRecord: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}