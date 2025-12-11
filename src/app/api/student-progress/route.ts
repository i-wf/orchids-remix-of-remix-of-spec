import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { studentProgress, users, lessons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const lessonId = searchParams.get('lessonId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const record = await db.select()
        .from(studentProgress)
        .where(eq(studentProgress.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Progress record not found' }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters
    let query = db.select().from(studentProgress);

    // Build WHERE conditions
    const conditions = [];
    
    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json({
          error: 'Valid studentId is required',
          code: 'INVALID_STUDENT_ID'
        }, { status: 400 });
      }
      conditions.push(eq(studentProgress.studentId, parseInt(studentId)));
    }

    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json({
          error: 'Valid lessonId is required',
          code: 'INVALID_LESSON_ID'
        }, { status: 400 });
      }
      conditions.push(eq(studentProgress.lessonId, parseInt(lessonId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, lessonId, videoWatched, homeworkCompleted, homeworkScore } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json({
        error: 'studentId is required',
        code: 'MISSING_STUDENT_ID'
      }, { status: 400 });
    }

    if (!lessonId) {
      return NextResponse.json({
        error: 'lessonId is required',
        code: 'MISSING_LESSON_ID'
      }, { status: 400 });
    }

    // Validate studentId is a number
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json({
        error: 'studentId must be a valid number',
        code: 'INVALID_STUDENT_ID'
      }, { status: 400 });
    }

    // Validate lessonId is a number
    if (isNaN(parseInt(lessonId))) {
      return NextResponse.json({
        error: 'lessonId must be a valid number',
        code: 'INVALID_LESSON_ID'
      }, { status: 400 });
    }

    // Validate homeworkScore if provided
    if (homeworkScore !== undefined && homeworkScore !== null) {
      if (isNaN(parseInt(homeworkScore)) || parseInt(homeworkScore) < 0) {
        return NextResponse.json({
          error: 'homeworkScore must be a non-negative number',
          code: 'INVALID_HOMEWORK_SCORE'
        }, { status: 400 });
      }
    }

    // Validate studentId exists and is a student
    const student = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(studentId)))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      }, { status: 400 });
    }

    if (student[0].role !== 'student') {
      return NextResponse.json({
        error: 'User is not a student',
        code: 'NOT_A_STUDENT'
      }, { status: 400 });
    }

    // Validate lessonId exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId)))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND'
      }, { status: 400 });
    }

    // Check if progress record already exists for this student-lesson combination
    const existingProgress = await db.select()
      .from(studentProgress)
      .where(and(
        eq(studentProgress.studentId, parseInt(studentId)),
        eq(studentProgress.lessonId, parseInt(lessonId))
      ))
      .limit(1);

    if (existingProgress.length > 0) {
      return NextResponse.json({
        error: 'Progress record already exists for this student and lesson',
        code: 'PROGRESS_EXISTS'
      }, { status: 400 });
    }

    // Create new progress record
    const now = new Date().toISOString();
    const newProgress = await db.insert(studentProgress)
      .values({
        studentId: parseInt(studentId),
        lessonId: parseInt(lessonId),
        videoWatched: videoWatched ?? false,
        homeworkCompleted: homeworkCompleted ?? false,
        homeworkScore: homeworkScore !== undefined && homeworkScore !== null ? parseInt(homeworkScore) : null,
        lastAccessed: now,
        createdAt: now
      })
      .returning();

    return NextResponse.json(newProgress[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(studentProgress)
      .where(eq(studentProgress.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Progress record not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { videoWatched, homeworkCompleted, homeworkScore, studentId, lessonId } = body;

    // Do not allow changing studentId or lessonId
    if (studentId !== undefined) {
      return NextResponse.json({
        error: 'Cannot change studentId',
        code: 'STUDENT_ID_IMMUTABLE'
      }, { status: 400 });
    }

    if (lessonId !== undefined) {
      return NextResponse.json({
        error: 'Cannot change lessonId',
        code: 'LESSON_ID_IMMUTABLE'
      }, { status: 400 });
    }

    // Validate homeworkScore if provided
    if (homeworkScore !== undefined && homeworkScore !== null) {
      if (isNaN(parseInt(homeworkScore)) || parseInt(homeworkScore) < 0) {
        return NextResponse.json({
          error: 'homeworkScore must be a non-negative number',
          code: 'INVALID_HOMEWORK_SCORE'
        }, { status: 400 });
      }
    }

    // Build update object
    const updates: any = {
      lastAccessed: new Date().toISOString()
    };

    if (videoWatched !== undefined) {
      updates.videoWatched = videoWatched;
    }

    if (homeworkCompleted !== undefined) {
      updates.homeworkCompleted = homeworkCompleted;
    }

    if (homeworkScore !== undefined) {
      updates.homeworkScore = homeworkScore !== null ? parseInt(homeworkScore) : null;
    }

    // Update record
    const updated = await db.update(studentProgress)
      .set(updates)
      .where(eq(studentProgress.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(studentProgress)
      .where(eq(studentProgress.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Progress record not found'
      }, { status: 404 });
    }

    // Delete record
    const deleted = await db.delete(studentProgress)
      .where(eq(studentProgress.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Progress record deleted successfully',
      record: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}