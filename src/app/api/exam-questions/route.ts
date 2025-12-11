import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { examQuestions, lessons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const lessonId = searchParams.get('lessonId');
    const includeAnswers = searchParams.get('includeAnswers') !== 'false';

    // Single exam question by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const question = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.id, parseInt(id)))
        .limit(1);

      if (question.length === 0) {
        return NextResponse.json(
          { error: 'Exam question not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const result = question[0];

      // Hide answers if includeAnswers is false
      if (!includeAnswers) {
        const { correctAnswer, explanation, ...questionWithoutAnswers } = result;
        return NextResponse.json(questionWithoutAnswers, { status: 200 });
      }

      return NextResponse.json(result, { status: 200 });
    }

    // List exam questions with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(examQuestions);

    // Filter by lessonId if provided
    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'Valid lessonId is required', code: 'INVALID_LESSON_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(examQuestions.lessonId, parseInt(lessonId)));
    }

    const results = await query
      .orderBy(desc(examQuestions.questionOrder))
      .limit(limit)
      .offset(offset);

    // Hide answers if includeAnswers is false
    if (!includeAnswers) {
      const sanitizedResults = results.map(({ correctAnswer, explanation, ...rest }) => rest);
      return NextResponse.json(sanitizedResults, { status: 200 });
    }

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
    const {
      lessonId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      questionOrder,
    } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required', code: 'MISSING_LESSON_ID' },
        { status: 400 }
      );
    }

    if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
      return NextResponse.json(
        { error: 'questionText is required and must be a non-empty string', code: 'INVALID_QUESTION_TEXT' },
        { status: 400 }
      );
    }

    if (!optionA || typeof optionA !== 'string' || optionA.trim().length === 0) {
      return NextResponse.json(
        { error: 'optionA is required and must be a non-empty string', code: 'INVALID_OPTION_A' },
        { status: 400 }
      );
    }

    if (!optionB || typeof optionB !== 'string' || optionB.trim().length === 0) {
      return NextResponse.json(
        { error: 'optionB is required and must be a non-empty string', code: 'INVALID_OPTION_B' },
        { status: 400 }
      );
    }

    if (!optionC || typeof optionC !== 'string' || optionC.trim().length === 0) {
      return NextResponse.json(
        { error: 'optionC is required and must be a non-empty string', code: 'INVALID_OPTION_C' },
        { status: 400 }
      );
    }

    if (!optionD || typeof optionD !== 'string' || optionD.trim().length === 0) {
      return NextResponse.json(
        { error: 'optionD is required and must be a non-empty string', code: 'INVALID_OPTION_D' },
        { status: 400 }
      );
    }

    if (!correctAnswer || !['a', 'b', 'c', 'd'].includes(correctAnswer.toLowerCase())) {
      return NextResponse.json(
        { error: 'correctAnswer must be one of: a, b, c, d', code: 'INVALID_CORRECT_ANSWER' },
        { status: 400 }
      );
    }

    if (questionOrder === undefined || questionOrder === null || isNaN(parseInt(questionOrder)) || parseInt(questionOrder) < 1) {
      return NextResponse.json(
        { error: 'questionOrder is required and must be a positive integer', code: 'INVALID_QUESTION_ORDER' },
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
        { error: 'Lesson with provided lessonId does not exist', code: 'LESSON_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new exam question
    const newQuestion = await db
      .insert(examQuestions)
      .values({
        lessonId: parseInt(lessonId),
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: correctAnswer.toLowerCase(),
        explanation: explanation ? explanation.trim() : null,
        questionOrder: parseInt(questionOrder),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newQuestion[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if exam question exists
    const existing = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Exam question not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      questionOrder,
    } = body;

    const updates: any = {};

    // Validate and add fields to update
    if (questionText !== undefined) {
      if (typeof questionText !== 'string' || questionText.trim().length === 0) {
        return NextResponse.json(
          { error: 'questionText must be a non-empty string', code: 'INVALID_QUESTION_TEXT' },
          { status: 400 }
        );
      }
      updates.questionText = questionText.trim();
    }

    if (optionA !== undefined) {
      if (typeof optionA !== 'string' || optionA.trim().length === 0) {
        return NextResponse.json(
          { error: 'optionA must be a non-empty string', code: 'INVALID_OPTION_A' },
          { status: 400 }
        );
      }
      updates.optionA = optionA.trim();
    }

    if (optionB !== undefined) {
      if (typeof optionB !== 'string' || optionB.trim().length === 0) {
        return NextResponse.json(
          { error: 'optionB must be a non-empty string', code: 'INVALID_OPTION_B' },
          { status: 400 }
        );
      }
      updates.optionB = optionB.trim();
    }

    if (optionC !== undefined) {
      if (typeof optionC !== 'string' || optionC.trim().length === 0) {
        return NextResponse.json(
          { error: 'optionC must be a non-empty string', code: 'INVALID_OPTION_C' },
          { status: 400 }
        );
      }
      updates.optionC = optionC.trim();
    }

    if (optionD !== undefined) {
      if (typeof optionD !== 'string' || optionD.trim().length === 0) {
        return NextResponse.json(
          { error: 'optionD must be a non-empty string', code: 'INVALID_OPTION_D' },
          { status: 400 }
        );
      }
      updates.optionD = optionD.trim();
    }

    if (correctAnswer !== undefined) {
      if (!['a', 'b', 'c', 'd'].includes(correctAnswer.toLowerCase())) {
        return NextResponse.json(
          { error: 'correctAnswer must be one of: a, b, c, d', code: 'INVALID_CORRECT_ANSWER' },
          { status: 400 }
        );
      }
      updates.correctAnswer = correctAnswer.toLowerCase();
    }

    if (explanation !== undefined) {
      updates.explanation = explanation ? explanation.trim() : null;
    }

    if (questionOrder !== undefined) {
      if (isNaN(parseInt(questionOrder)) || parseInt(questionOrder) < 1) {
        return NextResponse.json(
          { error: 'questionOrder must be a positive integer', code: 'INVALID_QUESTION_ORDER' },
          { status: 400 }
        );
      }
      updates.questionOrder = parseInt(questionOrder);
    }

    // If no valid updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update exam question
    const updated = await db
      .update(examQuestions)
      .set(updates)
      .where(eq(examQuestions.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if exam question exists
    const existing = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Exam question not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete exam question
    const deleted = await db
      .delete(examQuestions)
      .where(eq(examQuestions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Exam question deleted successfully',
        deleted: deleted[0],
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