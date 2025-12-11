import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');

    // Validate studentId parameter
    if (!studentIdParam) {
      return NextResponse.json(
        { 
          error: 'studentId parameter is required',
          code: 'MISSING_STUDENT_ID' 
        },
        { status: 400 }
      );
    }

    const studentId = parseInt(studentIdParam);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { 
          error: 'studentId must be a valid integer',
          code: 'INVALID_STUDENT_ID' 
        },
        { status: 400 }
      );
    }

    // Validate student exists and has student role
    const student = await db.select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json(
        { 
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND' 
        },
        { status: 400 }
      );
    }

    if (student[0].role !== 'student') {
      return NextResponse.json(
        { 
          error: 'User is not a student',
          code: 'NOT_A_STUDENT' 
        },
        { status: 400 }
      );
    }

    // Get unread notification count using SQL COUNT for efficiency
    const result = await db.select({
      count: sql<number>`count(*)`
    })
      .from(notifications)
      .where(
        and(
          eq(notifications.studentId, studentId),
          eq(notifications.isRead, false)
        )
      );

    const unreadCount = Number(result[0]?.count ?? 0);

    return NextResponse.json(
      {
        studentId,
        unreadCount
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET unread count error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}