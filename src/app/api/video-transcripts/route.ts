import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videoTranscripts, lessons } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const lessonId = searchParams.get('lessonId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single record by transcript id
    if (id) {
      const transcriptId = parseInt(id);
      if (isNaN(transcriptId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const transcript = await db.select()
        .from(videoTranscripts)
        .where(eq(videoTranscripts.id, transcriptId))
        .limit(1);

      if (transcript.length === 0) {
        return NextResponse.json({ 
          error: 'Transcript not found',
          code: 'TRANSCRIPT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(transcript[0], { status: 200 });
    }

    // Single record by lessonId
    if (lessonId) {
      const lessonIdInt = parseInt(lessonId);
      if (isNaN(lessonIdInt)) {
        return NextResponse.json({ 
          error: "Valid lesson ID is required",
          code: "INVALID_LESSON_ID" 
        }, { status: 400 });
      }

      const transcript = await db.select()
        .from(videoTranscripts)
        .where(eq(videoTranscripts.lessonId, lessonIdInt))
        .limit(1);

      if (transcript.length === 0) {
        return NextResponse.json({ 
          error: 'Transcript not found for this lesson',
          code: 'TRANSCRIPT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(transcript[0], { status: 200 });
    }

    // List with optional status filter
    let query = db.select().from(videoTranscripts);

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      query = query.where(eq(videoTranscripts.processingStatus, status));
    }

    const results = await query
      .orderBy(desc(videoTranscripts.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { lessonId, transcriptText, processingStatus } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json({ 
        error: "Lesson ID is required",
        code: "MISSING_LESSON_ID" 
      }, { status: 400 });
    }

    if (!transcriptText || transcriptText.trim() === '') {
      return NextResponse.json({ 
        error: "Transcript text is required",
        code: "MISSING_TRANSCRIPT_TEXT" 
      }, { status: 400 });
    }

    // Validate lessonId is a valid integer
    const lessonIdInt = parseInt(lessonId);
    if (isNaN(lessonIdInt)) {
      return NextResponse.json({ 
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    // Validate lesson exists
    const lessonExists = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonIdInt))
      .limit(1);

    if (lessonExists.length === 0) {
      return NextResponse.json({ 
        error: "Lesson not found",
        code: "LESSON_NOT_FOUND" 
      }, { status: 400 });
    }

    // Check if transcript already exists for this lesson
    const existingTranscript = await db.select()
      .from(videoTranscripts)
      .where(eq(videoTranscripts.lessonId, lessonIdInt))
      .limit(1);

    if (existingTranscript.length > 0) {
      return NextResponse.json({ 
        error: 'Transcript already exists for this lesson',
        code: 'TRANSCRIPT_EXISTS' 
      }, { status: 400 });
    }

    // Validate processing status if provided
    const finalStatus = processingStatus || 'pending';
    if (!VALID_STATUSES.includes(finalStatus as any)) {
      return NextResponse.json({ 
        error: `Invalid processing status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Create transcript
    const newTranscript = await db.insert(videoTranscripts)
      .values({
        lessonId: lessonIdInt,
        transcriptText: transcriptText.trim(),
        processingStatus: finalStatus,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newTranscript[0], { status: 201 });

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

    const transcriptId = parseInt(id);
    const body = await request.json();
    const { transcriptText, processingStatus } = body;

    // Check if transcript exists
    const existing = await db.select()
      .from(videoTranscripts)
      .where(eq(videoTranscripts.id, transcriptId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Transcript not found',
        code: 'TRANSCRIPT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object
    const updates: any = {};

    if (transcriptText !== undefined) {
      if (transcriptText.trim() === '') {
        return NextResponse.json({ 
          error: "Transcript text cannot be empty",
          code: "EMPTY_TRANSCRIPT_TEXT" 
        }, { status: 400 });
      }
      updates.transcriptText = transcriptText.trim();
    }

    if (processingStatus !== undefined) {
      if (!VALID_STATUSES.includes(processingStatus as any)) {
        return NextResponse.json({ 
          error: `Invalid processing status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.processingStatus = processingStatus;
    }

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Update transcript
    const updated = await db.update(videoTranscripts)
      .set(updates)
      .where(eq(videoTranscripts.id, transcriptId))
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

    const transcriptId = parseInt(id);

    // Check if transcript exists
    const existing = await db.select()
      .from(videoTranscripts)
      .where(eq(videoTranscripts.id, transcriptId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Transcript not found',
        code: 'TRANSCRIPT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete transcript
    const deleted = await db.delete(videoTranscripts)
      .where(eq(videoTranscripts.id, transcriptId))
      .returning();

    return NextResponse.json({
      message: 'Transcript deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}