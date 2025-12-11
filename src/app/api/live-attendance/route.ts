import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { liveAttendance, users, liveSessions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const liveSessionId = searchParams.get('liveSessionId');
    const studentId = searchParams.get('studentId');

    let conditions = [];
    
    if (liveSessionId) {
      conditions.push(eq(liveAttendance.liveSessionId, parseInt(liveSessionId)));
    }
    
    if (studentId) {
      conditions.push(eq(liveAttendance.studentId, parseInt(studentId)));
    }

    const attendance = await db
      .select({
        id: liveAttendance.id,
        liveSessionId: liveAttendance.liveSessionId,
        studentId: liveAttendance.studentId,
        joinedAt: liveAttendance.joinedAt,
        createdAt: liveAttendance.createdAt,
        studentName: users.name,
        sessionTitle: liveSessions.title,
        sessionScheduledAt: liveSessions.scheduledAt,
      })
      .from(liveAttendance)
      .leftJoin(users, eq(liveAttendance.studentId, users.id))
      .leftJoin(liveSessions, eq(liveAttendance.liveSessionId, liveSessions.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(liveAttendance.joinedAt));

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { liveSessionId, studentId } = body;

    if (!liveSessionId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(liveAttendance)
      .where(and(
        eq(liveAttendance.liveSessionId, liveSessionId),
        eq(liveAttendance.studentId, studentId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already recorded', attendance: existing[0] });
    }

    const [attendance] = await db.insert(liveAttendance).values({
      liveSessionId,
      studentId,
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
