import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiSummaries, lessons } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const lessonId = searchParams.get('lessonId');

    // Single record by summary id
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const summary = await db.select()
        .from(aiSummaries)
        .where(eq(aiSummaries.id, parseInt(id)))
        .limit(1);

      if (summary.length === 0) {
        return NextResponse.json({ 
          error: 'Summary not found',
          code: 'SUMMARY_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(summary[0], { status: 200 });
    }

    // Single record by lessonId
    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json({ 
          error: "Valid lesson ID is required",
          code: "INVALID_LESSON_ID" 
        }, { status: 400 });
      }

      const summary = await db.select()
        .from(aiSummaries)
        .where(eq(aiSummaries.lessonId, parseInt(lessonId)))
        .limit(1);

      if (summary.length === 0) {
        return NextResponse.json({ 
          error: 'Summary not found for this lesson',
          code: 'SUMMARY_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(summary[0], { status: 200 });
    }

    // List with pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const summaries = await db.select()
      .from(aiSummaries)
      .orderBy(desc(aiSummaries.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(summaries, { status: 200 });
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
    const { lessonId, summaryText } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json({ 
        error: "Lesson ID is required",
        code: "MISSING_LESSON_ID" 
      }, { status: 400 });
    }

    if (!summaryText) {
      return NextResponse.json({ 
        error: "Summary text is required",
        code: "MISSING_SUMMARY_TEXT" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(lessonId))) {
      return NextResponse.json({ 
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    // Validate lesson exists
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

    // Check if summary already exists for this lesson
    const existingSummary = await db.select()
      .from(aiSummaries)
      .where(eq(aiSummaries.lessonId, parseInt(lessonId)))
      .limit(1);

    if (existingSummary.length > 0) {
      return NextResponse.json({ 
        error: 'Summary already exists for this lesson',
        code: 'SUMMARY_EXISTS' 
      }, { status: 400 });
    }

    // Create new summary
    const newSummary = await db.insert(aiSummaries)
      .values({
        lessonId: parseInt(lessonId),
        summaryText: summaryText.trim(),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newSummary[0], { status: 201 });
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { summaryText } = body;

    // Validate summary text
    if (!summaryText) {
      return NextResponse.json({ 
        error: "Summary text is required",
        code: "MISSING_SUMMARY_TEXT" 
      }, { status: 400 });
    }

    // Check if summary exists
    const existingSummary = await db.select()
      .from(aiSummaries)
      .where(eq(aiSummaries.id, parseInt(id)))
      .limit(1);

    if (existingSummary.length === 0) {
      return NextResponse.json({ 
        error: 'Summary not found',
        code: 'SUMMARY_NOT_FOUND' 
      }, { status: 404 });
    }

    // Update summary
    const updated = await db.update(aiSummaries)
      .set({
        summaryText: summaryText.trim()
      })
      .where(eq(aiSummaries.id, parseInt(id)))
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if summary exists
    const existingSummary = await db.select()
      .from(aiSummaries)
      .where(eq(aiSummaries.id, parseInt(id)))
      .limit(1);

    if (existingSummary.length === 0) {
      return NextResponse.json({ 
        error: 'Summary not found',
        code: 'SUMMARY_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete summary
    const deleted = await db.delete(aiSummaries)
      .where(eq(aiSummaries.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Summary deleted successfully',
      summary: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}