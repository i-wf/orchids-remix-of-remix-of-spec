import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users, lessons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_NOTIFICATION_TYPES = ['new_lesson', 'subscription_expiring', 'payment_approved'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List notifications with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const lessonId = searchParams.get('lessonId');
    const notificationType = searchParams.get('notificationType');
    const isRead = searchParams.get('isRead');

    let query = db.select().from(notifications);

    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(notifications.studentId, parseInt(studentId)));
    }

    if (lessonId) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'Valid lessonId is required', code: 'INVALID_LESSON_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(notifications.lessonId, parseInt(lessonId)));
    }

    if (notificationType) {
      if (!VALID_NOTIFICATION_TYPES.includes(notificationType as any)) {
        return NextResponse.json(
          { error: 'Invalid notification type', code: 'INVALID_NOTIFICATION_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(notifications.notificationType, notificationType));
    }

    if (isRead !== null && isRead !== undefined) {
      const isReadBool = isRead === 'true';
      conditions.push(eq(notifications.isRead, isReadBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
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
    const { studentId, notificationType, message, lessonId, isRead } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!notificationType) {
      return NextResponse.json(
        { error: 'notificationType is required', code: 'MISSING_NOTIFICATION_TYPE' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!VALID_NOTIFICATION_TYPES.includes(notificationType)) {
      return NextResponse.json(
        {
          error: `notificationType must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
          code: 'INVALID_NOTIFICATION_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate studentId is a number
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json(
        { error: 'studentId must be a valid number', code: 'INVALID_STUDENT_ID' },
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
        { error: 'User must be a student', code: 'USER_NOT_STUDENT' },
        { status: 400 }
      );
    }

    // Validate lessonId if provided
    if (lessonId !== undefined && lessonId !== null) {
      if (isNaN(parseInt(lessonId))) {
        return NextResponse.json(
          { error: 'lessonId must be a valid number', code: 'INVALID_LESSON_ID' },
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
    }

    // Prepare insert data
    const insertData: any = {
      studentId: parseInt(studentId),
      notificationType: notificationType.trim(),
      message: message.trim(),
      isRead: isRead ?? false,
      createdAt: new Date().toISOString(),
    };

    if (lessonId !== undefined && lessonId !== null) {
      insertData.lessonId = parseInt(lessonId);
    }

    const newNotification = await db
      .insert(notifications)
      .values(insertData)
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
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
    const { isRead, message, studentId, lessonId, notificationType, createdAt } = body;

    // Validate that no immutable fields are being updated
    if (studentId !== undefined) {
      return NextResponse.json(
        { error: 'studentId cannot be updated', code: 'IMMUTABLE_FIELD' },
        { status: 400 }
      );
    }

    if (lessonId !== undefined) {
      return NextResponse.json(
        { error: 'lessonId cannot be updated', code: 'IMMUTABLE_FIELD' },
        { status: 400 }
      );
    }

    if (notificationType !== undefined) {
      return NextResponse.json(
        { error: 'notificationType cannot be updated', code: 'IMMUTABLE_FIELD' },
        { status: 400 }
      );
    }

    if (createdAt !== undefined) {
      return NextResponse.json(
        { error: 'createdAt cannot be updated', code: 'IMMUTABLE_FIELD' },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only allowed fields
    const updates: any = {};

    if (isRead !== undefined) {
      updates.isRead = Boolean(isRead);
    }

    if (message !== undefined) {
      if (!message || message.trim() === '') {
        return NextResponse.json(
          { error: 'message cannot be empty', code: 'INVALID_MESSAGE' },
          { status: 400 }
        );
      }
      updates.message = message.trim();
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(notifications)
      .set(updates)
      .where(eq(notifications.id, parseInt(id)))
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

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Notification deleted successfully',
        notification: deleted[0],
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