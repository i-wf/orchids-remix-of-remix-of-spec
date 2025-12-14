import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, users, lessonFolders } from '@/db/schema';
import { eq, like, or, and, desc, asc } from 'drizzle-orm';
import { isValidYouTubeUrl } from '@/lib/youtube-validator';

const VALID_GRADES = [
  '4-primary',
  '5-primary',
  '6-primary',
  '1-preparatory',
  '2-preparatory',
  '3-preparatory',
  '1-secondary',
  '2-secondary',
  '3-secondary'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, parseInt(id)))
        .limit(1);

      if (lesson.length === 0) {
        return NextResponse.json(
          { error: 'Lesson not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(lesson[0]);
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const teacherId = searchParams.get('teacherId');
    const folderId = searchParams.get('folderId');
    const grade = searchParams.get('grade');
    const isFreeParam = searchParams.get('isFree');

    let query = db.select().from(lessons);

    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(
        or(
          like(lessons.title, `%${search}%`),
          like(lessons.description, `%${search}%`)
        )
      );
    }

    // Filter by teacherId
    if (teacherId) {
      const teacherIdNum = parseInt(teacherId);
      if (!isNaN(teacherIdNum)) {
        conditions.push(eq(lessons.teacherId, teacherIdNum));
      }
    }

    // Filter by folderId
    if (folderId) {
      const folderIdNum = parseInt(folderId);
      if (!isNaN(folderIdNum)) {
        conditions.push(eq(lessons.folderId, folderIdNum));
      }
    }

    // Filter by grade
    if (grade && VALID_GRADES.includes(grade)) {
      conditions.push(eq(lessons.grade, grade));
    }

    // Filter by isFree
    if (isFreeParam !== null) {
      const isFreeValue = isFreeParam === 'true';
      conditions.push(eq(lessons.isFree, isFreeValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by: free lessons first, then by created date descending
    const results = await query
      .orderBy(desc(lessons.isFree), desc(lessons.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
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
    const { title, description, folderId, teacherId, videoUrl, studyPdfUrl, homeworkPdfUrl, lessonNotes, grade, isFree } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required', code: 'MISSING_FOLDER_ID' },
        { status: 400 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required', code: 'MISSING_TEACHER_ID' },
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
          error: `Grade must be one of: ${VALID_GRADES.join(', ')}`, 
          code: 'INVALID_GRADE' 
        },
        { status: 400 }
      );
    }

    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Only YouTube video links are allowed for security reasons', code: 'INVALID_VIDEO_URL' },
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
        { error: 'User is not a teacher', code: 'USER_NOT_TEACHER' },
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
        { error: 'Folder not found', code: 'FOLDER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new lesson
    const newLesson = await db
      .insert(lessons)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
        folderId: parseInt(folderId),
        teacherId: parseInt(teacherId),
        videoUrl: videoUrl ? videoUrl.trim() : null,
        studyPdfUrl: studyPdfUrl ? studyPdfUrl.trim() : null,
        homeworkPdfUrl: homeworkPdfUrl ? homeworkPdfUrl.trim() : null,
        lessonNotes: lessonNotes ? lessonNotes.trim() : null,
        grade: grade,
        isFree: isFree !== undefined ? isFree : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    const createdLesson = newLesson[0];

    if (!isFree) {
      const { subscriptions, notifications } = await import('@/db/schema');
      
      const folderSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.folderId, parseInt(folderId)),
            eq(subscriptions.isActive, true)
          )
        );

      if (folderSubscriptions.length > 0) {
        const notificationPromises = folderSubscriptions.map(async (sub) => {
          return db.insert(notifications).values({
            studentId: sub.studentId,
            lessonId: createdLesson.id,
            notificationType: 'new_lesson',
            message: `حصة جديدة: ${title.trim()} في ${folder[0].name}`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        });

        await Promise.all(notificationPromises);
      }
    }

    return NextResponse.json(createdLesson, { status: 201 });
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

    // Check if lesson exists
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, videoUrl, studyPdfUrl, homeworkPdfUrl, lessonNotes, grade, folderId, isFree, coverImage } = body;

    // Validate grade if being changed
    if (grade && !VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        { 
          error: `Grade must be one of: ${VALID_GRADES.join(', ')}`, 
          code: 'INVALID_GRADE' 
        },
        { status: 400 }
      );
    }

    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: 'Only YouTube video links are allowed for security reasons', code: 'INVALID_VIDEO_URL' },
        { status: 400 }
      );
    }

    // Validate folderId if being changed
    if (folderId) {
      const folder = await db
        .select()
        .from(lessonFolders)
        .where(eq(lessonFolders.id, parseInt(folderId)))
        .limit(1);

      if (folder.length === 0) {
        return NextResponse.json(
          { error: 'Folder not found', code: 'FOLDER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl ? videoUrl.trim() : null;
    if (studyPdfUrl !== undefined) updates.studyPdfUrl = studyPdfUrl ? studyPdfUrl.trim() : null;
    if (homeworkPdfUrl !== undefined) updates.homeworkPdfUrl = homeworkPdfUrl ? homeworkPdfUrl.trim() : null;
    if (lessonNotes !== undefined) updates.lessonNotes = lessonNotes ? lessonNotes.trim() : null;
    if (grade !== undefined) updates.grade = grade;
    if (folderId !== undefined) updates.folderId = parseInt(folderId);
    if (isFree !== undefined) updates.isFree = isFree;
    if (coverImage !== undefined) updates.coverImage = coverImage || null;

    const updated = await db
      .update(lessons)
      .set(updates)
      .where(eq(lessons.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
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

    // Check if lesson exists
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(lessons)
      .where(eq(lessons.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Lesson deleted successfully',
      lesson: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}