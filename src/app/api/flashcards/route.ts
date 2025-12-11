import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flashcards, lessons, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const lessonId = searchParams.get('lessonId');
    const type = searchParams.get('type');
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

      const flashcard = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.id, parseInt(id)))
        .limit(1);

      if (flashcard.length === 0) {
        return NextResponse.json(
          { error: 'Flashcard not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(flashcard[0], { status: 200 });
    }

    // List with filters
    let query = db.select().from(flashcards);
    const conditions = [];

    // Filter by lessonId
    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'Valid lesson ID is required', code: 'INVALID_LESSON_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(flashcards.lessonId, parseInt(lessonId)));
    }

    // Filter by type
    if (type) {
      if (type !== 'manual' && type !== 'ai') {
        return NextResponse.json(
          { error: 'Type must be "manual" or "ai"', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(flashcards.type, type));
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

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
    const { lessonId, question, answer, explanation, type, createdByTeacherId } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required', code: 'MISSING_LESSON_ID' },
        { status: 400 }
      );
    }

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question is required', code: 'MISSING_QUESTION' },
        { status: 400 }
      );
    }

    if (!answer || answer.trim() === '') {
      return NextResponse.json(
        { error: 'Answer is required', code: 'MISSING_ANSWER' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'manual' && type !== 'ai') {
      return NextResponse.json(
        { error: 'Type must be "manual" or "ai"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate manual flashcard has createdByTeacherId
    if (type === 'manual' && !createdByTeacherId) {
      return NextResponse.json(
        {
          error: 'Manual flashcards must have a teacher ID',
          code: 'MISSING_TEACHER_ID',
        },
        { status: 400 }
      );
    }

    // Validate lessonId exists
    const lessonExists = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId)))
      .limit(1);

    if (lessonExists.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate createdByTeacherId if provided
    if (createdByTeacherId) {
      const teacher = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, parseInt(createdByTeacherId)),
            eq(users.role, 'teacher')
          )
        )
        .limit(1);

      if (teacher.length === 0) {
        return NextResponse.json(
          {
            error: 'Invalid teacher ID or user is not a teacher',
            code: 'INVALID_TEACHER',
          },
          { status: 400 }
        );
      }
    }

    // Create flashcard
    const newFlashcard = await db
      .insert(flashcards)
      .values({
        lessonId: parseInt(lessonId),
        question: question.trim(),
        answer: answer.trim(),
        explanation: explanation ? explanation.trim() : null,
        type,
        createdByTeacherId: createdByTeacherId
          ? parseInt(createdByTeacherId)
          : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newFlashcard[0], { status: 201 });
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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { question, answer, explanation } = body;

    // Check if flashcard exists
    const existingFlashcard = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.id, parseInt(id)))
      .limit(1);

    if (existingFlashcard.length === 0) {
      return NextResponse.json(
        { error: 'Flashcard not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update object with only allowed fields
    const updates: {
      question?: string;
      answer?: string;
      explanation?: string | null;
    } = {};

    if (question !== undefined) {
      if (question.trim() === '') {
        return NextResponse.json(
          { error: 'Question cannot be empty', code: 'INVALID_QUESTION' },
          { status: 400 }
        );
      }
      updates.question = question.trim();
    }

    if (answer !== undefined) {
      if (answer.trim() === '') {
        return NextResponse.json(
          { error: 'Answer cannot be empty', code: 'INVALID_ANSWER' },
          { status: 400 }
        );
      }
      updates.answer = answer.trim();
    }

    if (explanation !== undefined) {
      updates.explanation = explanation ? explanation.trim() : null;
    }

    // Check if there are any valid updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update flashcard
    const updatedFlashcard = await db
      .update(flashcards)
      .set(updates)
      .where(eq(flashcards.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedFlashcard[0], { status: 200 });
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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if flashcard exists
    const existingFlashcard = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.id, parseInt(id)))
      .limit(1);

    if (existingFlashcard.length === 0) {
      return NextResponse.json(
        { error: 'Flashcard not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete flashcard
    const deleted = await db
      .delete(flashcards)
      .where(eq(flashcards.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Flashcard deleted successfully',
        flashcard: deleted[0],
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