import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ratings, users, lessonFolders } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single rating by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const rating = await db
        .select()
        .from(ratings)
        .where(eq(ratings.id, parseInt(id)))
        .limit(1);

      if (rating.length === 0) {
        return NextResponse.json(
          { error: 'Rating not found', code: 'RATING_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(rating[0], { status: 200 });
    }

    // List ratings with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const folderId = searchParams.get('folderId');
    const ratingValue = searchParams.get('rating');

    let query = db.select().from(ratings);

    // Build filter conditions
    const conditions = [];
    if (studentId) {
      conditions.push(eq(ratings.studentId, parseInt(studentId)));
    }
    if (teacherId) {
      conditions.push(eq(ratings.teacherId, parseInt(teacherId)));
    }
    if (folderId) {
      conditions.push(eq(ratings.folderId, parseInt(folderId)));
    }
    if (ratingValue) {
      conditions.push(eq(ratings.rating, parseInt(ratingValue)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(ratings.createdAt))
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
    const { studentId, teacherId, folderId, rating, reviewText } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required', code: 'MISSING_FOLDER_ID' },
        { status: 400 }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'rating is required', code: 'MISSING_RATING' },
        { status: 400 }
      );
    }

    // Validate rating value (1-5)
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5', code: 'INVALID_RATING' },
        { status: 400 }
      );
    }

    // Validate studentId exists and is a student
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

    // Validate teacherId exists and is a teacher
    const teacher = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(teacherId)))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
        { status: 400 }
      );
    }

    if (teacher[0].role !== 'teacher') {
      return NextResponse.json(
        { error: 'User must be a teacher', code: 'INVALID_TEACHER_ROLE' },
        { status: 400 }
      );
    }

    // Validate folderId exists
    const folder = await db
      .select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(folderId)))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json(
        { error: 'Lesson folder not found', code: 'FOLDER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check for duplicate rating (student already rated this teacher for this folder)
    const existingRating = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.studentId, parseInt(studentId)),
          eq(ratings.teacherId, parseInt(teacherId)),
          eq(ratings.folderId, parseInt(folderId))
        )
      )
      .limit(1);

    if (existingRating.length > 0) {
      return NextResponse.json(
        { 
          error: 'Student has already rated this teacher for this folder', 
          code: 'DUPLICATE_RATING' 
        },
        { status: 400 }
      );
    }

    // Create new rating
    const newRating = await db
      .insert(ratings)
      .values({
        studentId: parseInt(studentId),
        teacherId: parseInt(teacherId),
        folderId: parseInt(folderId),
        rating: ratingNum,
        reviewText: reviewText ? reviewText.trim() : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRating[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, reviewText } = body;

    // Check if trying to update forbidden fields
    if ('studentId' in body || 'teacherId' in body || 'folderId' in body || 'createdAt' in body) {
      return NextResponse.json(
        { 
          error: 'Cannot update studentId, teacherId, folderId, or createdAt', 
          code: 'FORBIDDEN_FIELD_UPDATE' 
        },
        { status: 400 }
      );
    }

    // Check if rating exists
    const existingRating = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, parseInt(id)))
      .limit(1);

    if (existingRating.length === 0) {
      return NextResponse.json(
        { error: 'Rating not found', code: 'RATING_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};

    if (rating !== undefined) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 5', code: 'INVALID_RATING' },
          { status: 400 }
        );
      }
      updates.rating = ratingNum;
    }

    if (reviewText !== undefined) {
      updates.reviewText = reviewText ? reviewText.trim() : null;
    }

    // If no updates provided, return current rating
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingRating[0], { status: 200 });
    }

    // Update rating
    const updated = await db
      .update(ratings)
      .set(updates)
      .where(eq(ratings.id, parseInt(id)))
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if rating exists
    const existingRating = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, parseInt(id)))
      .limit(1);

    if (existingRating.length === 0) {
      return NextResponse.json(
        { error: 'Rating not found', code: 'RATING_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete rating
    const deleted = await db
      .delete(ratings)
      .where(eq(ratings.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Rating deleted successfully',
        rating: deleted[0],
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