import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonComments, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const teacherId = searchParams.get('teacherId');

    if (lessonId) {
      const comments = await db
        .select({
          id: lessonComments.id,
          lessonId: lessonComments.lessonId,
          studentId: lessonComments.studentId,
          commentText: lessonComments.commentText,
          createdAt: lessonComments.createdAt,
          studentName: users.name,
        })
        .from(lessonComments)
        .leftJoin(users, eq(lessonComments.studentId, users.id))
        .where(eq(lessonComments.lessonId, parseInt(lessonId)))
        .orderBy(desc(lessonComments.createdAt));

      return NextResponse.json(comments);
    }

    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching lesson comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, studentId, commentText } = body;

    if (!lessonId || !studentId || !commentText) {
      return NextResponse.json(
        { error: 'lessonId, studentId, and commentText are required' },
        { status: 400 }
      );
    }

    const [comment] = await db
      .insert(lessonComments)
      .values({
        lessonId,
        studentId,
        commentText,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    await db.delete(lessonComments).where(eq(lessonComments.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
