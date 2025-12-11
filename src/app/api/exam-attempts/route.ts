import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { examAttempts, users, lessons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const attempt = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.id, parseInt(id)))
        .limit(1);

      if (attempt.length === 0) {
        return NextResponse.json(
          { error: 'Exam attempt not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(attempt[0], { status: 200 });
    }

    // List with filtering
    let query = db.select().from(examAttempts);
    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(examAttempts.studentId, parseInt(studentId)));
    }

    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'Valid lessonId is required', code: 'INVALID_LESSON_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(examAttempts.lessonId, parseInt(lessonId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const attempts = await query
      .orderBy(desc(examAttempts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(attempts, { status: 200 });
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
    const { studentId, lessonId, score, totalQuestions, answersJson } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required', code: 'MISSING_LESSON_ID' },
        { status: 400 }
      );
    }

    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: 'score is required', code: 'MISSING_SCORE' },
        { status: 400 }
      );
    }

    if (!totalQuestions) {
      return NextResponse.json(
        { error: 'totalQuestions is required', code: 'MISSING_TOTAL_QUESTIONS' },
        { status: 400 }
      );
    }

    if (!answersJson) {
      return NextResponse.json(
        { error: 'answersJson is required', code: 'MISSING_ANSWERS_JSON' },
        { status: 400 }
      );
    }

    // Validate data types
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json(
        { error: 'studentId must be a valid integer', code: 'INVALID_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(lessonId))) {
      return NextResponse.json(
        { error: 'lessonId must be a valid integer', code: 'INVALID_LESSON_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(score))) {
      return NextResponse.json(
        { error: 'score must be a valid integer', code: 'INVALID_SCORE' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(totalQuestions))) {
      return NextResponse.json(
        { error: 'totalQuestions must be a valid integer', code: 'INVALID_TOTAL_QUESTIONS' },
        { status: 400 }
      );
    }

    const parsedScore = parseInt(score);
    const parsedTotalQuestions = parseInt(totalQuestions);

    // Validate non-negative integers
    if (parsedScore < 0) {
      return NextResponse.json(
        { error: 'score must be a non-negative integer', code: 'INVALID_SCORE' },
        { status: 400 }
      );
    }

    if (parsedTotalQuestions < 0) {
      return NextResponse.json(
        { error: 'totalQuestions must be a non-negative integer', code: 'INVALID_TOTAL_QUESTIONS' },
        { status: 400 }
      );
    }

    // Validate score <= totalQuestions
    if (parsedScore > parsedTotalQuestions) {
      return NextResponse.json(
        { error: 'score cannot be greater than totalQuestions', code: 'INVALID_SCORE_RANGE' },
        { status: 400 }
      );
    }

    // Validate answersJson is valid JSON
    let parsedAnswers;
    try {
      parsedAnswers = typeof answersJson === 'string' ? JSON.parse(answersJson) : answersJson;
      // Ensure it can be stringified back
      JSON.stringify(parsedAnswers);
    } catch (e) {
      return NextResponse.json(
        { error: 'answersJson must be a valid JSON string or object', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Validate studentId exists in users table and is a student
    const student = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(studentId)))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 400 }
      );
    }

    if (student[0].role !== 'student') {
      return NextResponse.json(
        { error: 'User must be a student', code: 'INVALID_STUDENT_ROLE' },
        { status: 400 }
      );
    }

    // Validate lessonId exists in lessons table
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

    // Create exam attempt
    const newAttempt = await db
      .insert(examAttempts)
      .values({
        studentId: parseInt(studentId),
        lessonId: parseInt(lessonId),
        score: parsedScore,
        totalQuestions: parsedTotalQuestions,
        answersJson: typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newAttempt[0], { status: 201 });
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

    // Check if exam attempt exists
    const existing = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Exam attempt not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { score, totalQuestions, answersJson } = body;

    // Validate that no forbidden fields are being updated
    if ('studentId' in body || 'lessonId' in body || 'createdAt' in body) {
      return NextResponse.json(
        { error: 'Cannot update studentId, lessonId, or createdAt', code: 'FORBIDDEN_FIELD_UPDATE' },
        { status: 400 }
      );
    }

    const updates: any = {};

    // Validate and add score if provided
    if (score !== undefined) {
      if (isNaN(parseInt(score))) {
        return NextResponse.json(
          { error: 'score must be a valid integer', code: 'INVALID_SCORE' },
          { status: 400 }
        );
      }

      const parsedScore = parseInt(score);
      if (parsedScore < 0) {
        return NextResponse.json(
          { error: 'score must be a non-negative integer', code: 'INVALID_SCORE' },
          { status: 400 }
        );
      }

      updates.score = parsedScore;
    }

    // Validate and add totalQuestions if provided
    if (totalQuestions !== undefined) {
      if (isNaN(parseInt(totalQuestions))) {
        return NextResponse.json(
          { error: 'totalQuestions must be a valid integer', code: 'INVALID_TOTAL_QUESTIONS' },
          { status: 400 }
        );
      }

      const parsedTotalQuestions = parseInt(totalQuestions);
      if (parsedTotalQuestions < 0) {
        return NextResponse.json(
          { error: 'totalQuestions must be a non-negative integer', code: 'INVALID_TOTAL_QUESTIONS' },
          { status: 400 }
        );
      }

      updates.totalQuestions = parsedTotalQuestions;
    }

    // Validate score <= totalQuestions with updated values
    const finalScore = updates.score !== undefined ? updates.score : existing[0].score;
    const finalTotalQuestions = updates.totalQuestions !== undefined ? updates.totalQuestions : existing[0].totalQuestions;

    if (finalScore > finalTotalQuestions) {
      return NextResponse.json(
        { error: 'score cannot be greater than totalQuestions', code: 'INVALID_SCORE_RANGE' },
        { status: 400 }
      );
    }

    // Validate and add answersJson if provided
    if (answersJson !== undefined) {
      try {
        const parsedAnswers = typeof answersJson === 'string' ? JSON.parse(answersJson) : answersJson;
        JSON.stringify(parsedAnswers);
        updates.answersJson = typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'answersJson must be a valid JSON string or object', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update exam attempt
    const updated = await db
      .update(examAttempts)
      .set(updates)
      .where(eq(examAttempts.id, parseInt(id)))
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

    // Check if exam attempt exists
    const existing = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Exam attempt not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete exam attempt
    const deleted = await db
      .delete(examAttempts)
      .where(eq(examAttempts.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Exam attempt deleted successfully',
        examAttempt: deleted[0],
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