import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teacherUploads, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const fileType = searchParams.get('fileType');

    if (!teacherId) {
      return NextResponse.json({ 
        error: "Teacher ID is required",
        code: "MISSING_TEACHER_ID" 
      }, { status: 400 });
    }

    const teacherIdInt = parseInt(teacherId);
    if (isNaN(teacherIdInt)) {
      return NextResponse.json({ 
        error: "Valid teacher ID is required",
        code: "INVALID_TEACHER_ID" 
      }, { status: 400 });
    }

    let query = db.select()
      .from(teacherUploads)
      .where(eq(teacherUploads.teacherId, teacherIdInt));

    if (fileType && ['video', 'pdf', 'homework'].includes(fileType)) {
      query = db.select()
        .from(teacherUploads)
        .where(and(
          eq(teacherUploads.teacherId, teacherIdInt),
          eq(teacherUploads.fileType, fileType)
        ));
    }

    const uploads = await query.orderBy(desc(teacherUploads.createdAt));

    return NextResponse.json(uploads, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const teacherId = formData.get('teacherId') as string;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ 
        error: "File is required",
        code: "MISSING_FILE" 
      }, { status: 400 });
    }

    if (!teacherId) {
      return NextResponse.json({ 
        error: "Teacher ID is required",
        code: "MISSING_TEACHER_ID" 
      }, { status: 400 });
    }

    const teacherIdInt = parseInt(teacherId);
    if (isNaN(teacherIdInt)) {
      return NextResponse.json({ 
        error: "Valid teacher ID is required",
        code: "INVALID_TEACHER_ID" 
      }, { status: 400 });
    }

    if (!fileType || !['video', 'pdf', 'homework'].includes(fileType)) {
      return NextResponse.json({ 
        error: "Valid file type is required (video, pdf, homework)",
        code: "INVALID_FILE_TYPE" 
      }, { status: 400 });
    }

    const teacher = await db.select()
      .from(users)
      .where(eq(users.id, teacherIdInt))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json({ 
        error: "Teacher not found",
        code: "TEACHER_NOT_FOUND" 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folderMap: Record<string, string> = {
      'video': 'videos',
      'pdf': 'pdfs',
      'homework': 'homework'
    };
    const folder = folderMap[fileType];
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const relativePath = `/uploads/${folder}/${fileName}`;
    const newUpload = await db.insert(teacherUploads)
      .values({
        teacherId: teacherIdInt,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        filePath: relativePath,
        fileUrl: relativePath,
        mimeType: file.type,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newUpload[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    if (!teacherId || isNaN(parseInt(teacherId))) {
      return NextResponse.json({ 
        error: "Valid teacher ID is required",
        code: "INVALID_TEACHER_ID" 
      }, { status: 400 });
    }

    const uploadId = parseInt(id);
    const teacherIdInt = parseInt(teacherId);

    const existing = await db.select()
      .from(teacherUploads)
      .where(and(
        eq(teacherUploads.id, uploadId),
        eq(teacherUploads.teacherId, teacherIdInt)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Upload not found or not authorized',
        code: 'UPLOAD_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(teacherUploads)
      .where(eq(teacherUploads.id, uploadId))
      .returning();

    return NextResponse.json({
      message: 'Upload deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
