import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { secretaryPermissions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const secretaryId = searchParams.get('secretaryId');

    if (teacherId) {
      const permissions = await db
        .select({
          id: secretaryPermissions.id,
          secretaryId: secretaryPermissions.secretaryId,
          teacherId: secretaryPermissions.teacherId,
          canCreateFlashcards: secretaryPermissions.canCreateFlashcards,
          canCreateHomework: secretaryPermissions.canCreateHomework,
          canCreateExams: secretaryPermissions.canCreateExams,
          canEditLessons: secretaryPermissions.canEditLessons,
          secretaryName: users.name,
        })
        .from(secretaryPermissions)
        .leftJoin(users, eq(secretaryPermissions.secretaryId, users.id))
        .where(eq(secretaryPermissions.teacherId, parseInt(teacherId)));

      return NextResponse.json(permissions);
    }

    if (secretaryId) {
      const [permission] = await db
        .select()
        .from(secretaryPermissions)
        .where(eq(secretaryPermissions.secretaryId, parseInt(secretaryId)));

      return NextResponse.json(permission || null);
    }

    return NextResponse.json({ error: 'teacherId or secretaryId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secretaryId, teacherId, canCreateFlashcards, canCreateHomework, canCreateExams, canEditLessons } = body;

    if (!secretaryId || !teacherId) {
      return NextResponse.json(
        { error: 'secretaryId and teacherId are required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(secretaryPermissions)
      .where(
        and(
          eq(secretaryPermissions.secretaryId, secretaryId),
          eq(secretaryPermissions.teacherId, teacherId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(secretaryPermissions)
        .set({
          canCreateFlashcards: canCreateFlashcards ?? false,
          canCreateHomework: canCreateHomework ?? false,
          canCreateExams: canCreateExams ?? false,
          canEditLessons: canEditLessons ?? false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(secretaryPermissions.id, existing[0].id))
        .returning();

      return NextResponse.json(updated);
    }

    const [permission] = await db
      .insert(secretaryPermissions)
      .values({
        secretaryId,
        teacherId,
        canCreateFlashcards: canCreateFlashcards ?? false,
        canCreateHomework: canCreateHomework ?? false,
        canCreateExams: canCreateExams ?? false,
        canEditLessons: canEditLessons ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
