import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, users, lessonFolders } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentIdParam = searchParams.get('studentId');
    const folderIdParam = searchParams.get('folderId');

    // Validate required parameters
    if (!studentIdParam || !folderIdParam) {
      return NextResponse.json(
        { 
          error: 'studentId and folderId are required',
          code: 'MISSING_REQUIRED_PARAMETERS'
        },
        { status: 400 }
      );
    }

    // Validate parameters are valid integers
    const studentId = parseInt(studentIdParam);
    const folderId = parseInt(folderIdParam);

    if (isNaN(studentId) || isNaN(folderId)) {
      return NextResponse.json(
        { 
          error: 'studentId and folderId must be valid integers',
          code: 'INVALID_PARAMETER_TYPE'
        },
        { status: 400 }
      );
    }

    // Validate student exists and is a student
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
          code: 'INVALID_USER_ROLE'
        },
        { status: 400 }
      );
    }

    // Validate folder exists
    const folder = await db.select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, folderId))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json(
        { 
          error: 'Lesson folder not found',
          code: 'FOLDER_NOT_FOUND'
        },
        { status: 400 }
      );
    }

    // Query for active subscription
    const currentDate = new Date().toISOString();
    const activeSubscription = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.studentId, studentId),
          eq(subscriptions.folderId, folderId),
          eq(subscriptions.isActive, true),
          gte(subscriptions.endDate, currentDate)
        )
      )
      .limit(1);

    // Return response based on subscription status
    if (activeSubscription.length > 0) {
      return NextResponse.json(
        {
          hasAccess: true,
          subscription: activeSubscription[0]
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          hasAccess: false,
          subscription: null
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}