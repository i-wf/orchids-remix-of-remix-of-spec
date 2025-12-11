import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveSessions, users, lessonFolders } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const folderId = searchParams.get('folderId');
    const status = searchParams.get('status');

    let conditions = [];
    
    if (teacherId) {
      conditions.push(eq(liveSessions.teacherId, parseInt(teacherId)));
    }
    
    if (folderId) {
      conditions.push(eq(liveSessions.folderId, parseInt(folderId)));
    }
    
    if (status) {
      conditions.push(eq(liveSessions.status, status));
    }

    const sessions = await db
      .select({
        id: liveSessions.id,
        teacherId: liveSessions.teacherId,
        folderId: liveSessions.folderId,
        title: liveSessions.title,
        description: liveSessions.description,
        zoomLink: liveSessions.zoomLink,
        isFree: liveSessions.isFree,
        scheduledAt: liveSessions.scheduledAt,
        status: liveSessions.status,
        createdAt: liveSessions.createdAt,
        folderName: lessonFolders.name,
        teacherName: users.name,
      })
      .from(liveSessions)
      .leftJoin(lessonFolders, eq(liveSessions.folderId, lessonFolders.id))
      .leftJoin(users, eq(liveSessions.teacherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(liveSessions.scheduledAt));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch live sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, folderId, title, description, zoomLink, isFree, scheduledAt } = body;

    if (!teacherId || !folderId || !title || !zoomLink || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [session] = await db.insert(liveSessions).values({
      teacherId,
      folderId,
      title,
      description: description || null,
      zoomLink,
      isFree: isFree || false,
      scheduledAt,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating live session:', error);
    return NextResponse.json({ error: 'Failed to create live session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const [updated] = await db
      .update(liveSessions)
      .set(body)
      .where(eq(liveSessions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating live session:', error);
    return NextResponse.json({ error: 'Failed to update live session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    await db.delete(liveSessions).where(eq(liveSessions.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting live session:', error);
    return NextResponse.json({ error: 'Failed to delete live session' }, { status: 500 });
  }
}
