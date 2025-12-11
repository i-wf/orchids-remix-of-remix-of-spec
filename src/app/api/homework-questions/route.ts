import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { homeworkQuestions, lessons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const lessonId = searchParams.get('lessonId');
    const includeAnswers = searchParams.get('includeAnswers') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const question = await db.select()
        .from(homeworkQuestions)
        .where(eq(homeworkQuestions.id, parseInt(id)))
        .limit(1);

      if (question.length === 0) {
        return NextResponse.json({ 
          error: 'Homework question not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      const result = question[0];

      // Remove answer fields if includeAnswers is false
      if (!includeAnswers) {
        const { correctAnswer, explanation, ...questionWithoutAnswers } = result;
        return NextResponse.json(questionWithoutAnswers);
      }

      return NextResponse.json(result);
    }

    // List questions with optional lessonId filter
    let query = db.select().from(homeworkQuestions);

    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json({ 
          error: 'Valid lesson ID is required',
          code: 'INVALID_LESSON_ID' 
        }, { status: 400 });
      }
      query = query.where(eq(homeworkQuestions.lessonId, parseInt(lessonId)));
    }

    const results = await query.limit(limit).offset(offset);

    // Remove answer fields if includeAnswers is false
    if (!includeAnswers) {
      const questionsWithoutAnswers = results.map(({ correctAnswer, explanation, ...rest }) => rest);
      return NextResponse.json(questionsWithoutAnswers);
    }

    return NextResponse.json(results);
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
    const { 
      lessonId, 
      questionText, 
      optionA, 
      optionB, 
      optionC, 
      optionD, 
      correctAnswer,
      explanation 
    } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json({ 
        error: 'Lesson ID is required',
        code: 'MISSING_LESSON_ID' 
      }, { status: 400 });
    }

    if (!questionText || questionText.trim() === '') {
      return NextResponse.json({ 
        error: 'Question text is required',
        code: 'MISSING_QUESTION_TEXT' 
      }, { status: 400 });
    }

    if (!optionA || optionA.trim() === '') {
      return NextResponse.json({ 
        error: 'Option A is required',
        code: 'MISSING_OPTION_A' 
      }, { status: 400 });
    }

    if (!optionB || optionB.trim() === '') {
      return NextResponse.json({ 
        error: 'Option B is required',
        code: 'MISSING_OPTION_B' 
      }, { status: 400 });
    }

    if (!optionC || optionC.trim() === '') {
      return NextResponse.json({ 
        error: 'Option C is required',
        code: 'MISSING_OPTION_C' 
      }, { status: 400 });
    }

    if (!optionD || optionD.trim() === '') {
      return NextResponse.json({ 
        error: 'Option D is required',
        code: 'MISSING_OPTION_D' 
      }, { status: 400 });
    }

    if (!correctAnswer) {
      return NextResponse.json({ 
        error: 'Correct answer is required',
        code: 'MISSING_CORRECT_ANSWER' 
      }, { status: 400 });
    }

    // Validate correctAnswer is one of a, b, c, d
    const validAnswers = ['a', 'b', 'c', 'd'];
    if (!validAnswers.includes(correctAnswer.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Correct answer must be one of: a, b, c, d',
        code: 'INVALID_CORRECT_ANSWER' 
      }, { status: 400 });
    }

    // Validate lessonId exists
    const lessonExists = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId)))
      .limit(1);

    if (lessonExists.length === 0) {
      return NextResponse.json({ 
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND' 
      }, { status: 400 });
    }

    // Create homework question
    const newQuestion = await db.insert(homeworkQuestions)
      .values({
        lessonId: parseInt(lessonId),
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: correctAnswer.toLowerCase(),
        explanation: explanation ? explanation.trim() : null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newQuestion[0], { status: 201 });
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if question exists
    const existingQuestion = await db.select()
      .from(homeworkQuestions)
      .where(eq(homeworkQuestions.id, parseInt(id)))
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json({ 
        error: 'Homework question not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      questionText, 
      optionA, 
      optionB, 
      optionC, 
      optionD, 
      correctAnswer,
      explanation 
    } = body;

    const updates: any = {};

    if (questionText !== undefined) {
      if (questionText.trim() === '') {
        return NextResponse.json({ 
          error: 'Question text cannot be empty',
          code: 'INVALID_QUESTION_TEXT' 
        }, { status: 400 });
      }
      updates.questionText = questionText.trim();
    }

    if (optionA !== undefined) {
      if (optionA.trim() === '') {
        return NextResponse.json({ 
          error: 'Option A cannot be empty',
          code: 'INVALID_OPTION_A' 
        }, { status: 400 });
      }
      updates.optionA = optionA.trim();
    }

    if (optionB !== undefined) {
      if (optionB.trim() === '') {
        return NextResponse.json({ 
          error: 'Option B cannot be empty',
          code: 'INVALID_OPTION_B' 
        }, { status: 400 });
      }
      updates.optionB = optionB.trim();
    }

    if (optionC !== undefined) {
      if (optionC.trim() === '') {
        return NextResponse.json({ 
          error: 'Option C cannot be empty',
          code: 'INVALID_OPTION_C' 
        }, { status: 400 });
      }
      updates.optionC = optionC.trim();
    }

    if (optionD !== undefined) {
      if (optionD.trim() === '') {
        return NextResponse.json({ 
          error: 'Option D cannot be empty',
          code: 'INVALID_OPTION_D' 
        }, { status: 400 });
      }
      updates.optionD = optionD.trim();
    }

    if (correctAnswer !== undefined) {
      const validAnswers = ['a', 'b', 'c', 'd'];
      if (!validAnswers.includes(correctAnswer.toLowerCase())) {
        return NextResponse.json({ 
          error: 'Correct answer must be one of: a, b, c, d',
          code: 'INVALID_CORRECT_ANSWER' 
        }, { status: 400 });
      }
      updates.correctAnswer = correctAnswer.toLowerCase();
    }

    if (explanation !== undefined) {
      updates.explanation = explanation ? explanation.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATES' 
      }, { status: 400 });
    }

    const updatedQuestion = await db.update(homeworkQuestions)
      .set(updates)
      .where(eq(homeworkQuestions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedQuestion[0]);
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if question exists
    const existingQuestion = await db.select()
      .from(homeworkQuestions)
      .where(eq(homeworkQuestions.id, parseInt(id)))
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json({ 
        error: 'Homework question not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(homeworkQuestions)
      .where(eq(homeworkQuestions.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Homework question deleted successfully',
      deletedQuestion: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}