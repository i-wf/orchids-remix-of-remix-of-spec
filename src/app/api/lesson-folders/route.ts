import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonFolders, users } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

const VALID_GRADES = [
  '4-primary',
  '5-primary',
  '6-primary',
  '1-preparatory',
  '2-preparatory',
  '3-preparatory',
  '1-secondary',
  '2-secondary',
  '3-secondary',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const folder = await db
        .select()
        .from(lessonFolders)
        .where(eq(lessonFolders.id, parseInt(id)))
        .limit(1);

      if (folder.length === 0) {
        return NextResponse.json(
          { error: 'Lesson folder not found', code: 'FOLDER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(folder[0], { status: 200 });
    }

    // List with filters, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const teacherId = searchParams.get('teacherId');
    const grade = searchParams.get('grade');

    let query = db.select().from(lessonFolders);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(like(lessonFolders.name, `%${search}%`));
    }

    if (teacherId) {
      if (isNaN(parseInt(teacherId))) {
        return NextResponse.json(
          { error: 'Valid teacher ID is required', code: 'INVALID_TEACHER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(lessonFolders.teacherId, parseInt(teacherId)));
    }

    if (grade) {
      if (!VALID_GRADES.includes(grade)) {
        return NextResponse.json(
          { error: 'Invalid grade value', code: 'INVALID_GRADE' },
          { status: 400 }
        );
      }
      conditions.push(eq(lessonFolders.grade, grade));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(lessonFolders.createdAt))
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
    const { name, teacherId, grade, coverImage } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(teacherId))) {
      return NextResponse.json(
        { error: 'Valid teacher ID is required', code: 'INVALID_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!grade) {
      return NextResponse.json(
        { error: 'Grade is required', code: 'MISSING_GRADE' },
        { status: 400 }
      );
    }

    // Validate grade value
    if (!VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        {
          error: `Invalid grade. Must be one of: ${VALID_GRADES.join(', ')}`,
          code: 'INVALID_GRADE',
        },
        { status: 400 }
      );
    }

    // Validate teacher exists and has role='teacher'
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
        {
          error: 'User is not a teacher',
          code: 'NOT_A_TEACHER',
        },
        { status: 400 }
      );
    }

    // Create folder
    const newFolder = await db
      .insert(lessonFolders)
      .values({
        name: name.trim(),
        teacherId: parseInt(teacherId),
        grade,
        coverImage: coverImage || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newFolder[0], { status: 201 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if folder exists
    const existingFolder = await db
      .select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(id)))
      .limit(1);

    if (existingFolder.length === 0) {
      return NextResponse.json(
        { error: 'Lesson folder not found', code: 'FOLDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, grade, coverImage } = body;

    // Build update object
    const updates: { name?: string; grade?: string; coverImage?: string | null } = {};

    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (grade !== undefined) {
      if (!VALID_GRADES.includes(grade)) {
        return NextResponse.json(
          {
            error: `Invalid grade. Must be one of: ${VALID_GRADES.join(', ')}`,
            code: 'INVALID_GRADE',
          },
          { status: 400 }
        );
      }
      updates.grade = grade;
    }

    if (coverImage !== undefined) {
      updates.coverImage = coverImage;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update folder
    const updatedFolder = await db
      .update(lessonFolders)
      .set(updates)
      .where(eq(lessonFolders.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedFolder[0], { status: 200 });
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if folder exists
    const existingFolder = await db
      .select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(id)))
      .limit(1);

    if (existingFolder.length === 0) {
      return NextResponse.json(
        { error: 'Lesson folder not found', code: 'FOLDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete folder
    const deleted = await db
      .delete(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Lesson folder deleted successfully',
        folder: deleted[0],
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