import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { studentProgress, examAttempts, users, lessons, lessonFolders } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const teacherIdParam = searchParams.get('teacherId');

    if (teacherIdParam) {
      const teacherId = parseInt(teacherIdParam);
      if (isNaN(teacherId)) {
        return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
      }

      const teacherFolders = await db.select().from(lessonFolders).where(eq(lessonFolders.teacherId, teacherId));
      if (teacherFolders.length === 0) {
        return NextResponse.json({ progress: [], students: [] }, { status: 200 });
      }

      const folderIds = teacherFolders.map(f => f.id);
      const teacherLessons = await db.select().from(lessons).where(inArray(lessons.folderId, folderIds));
      if (teacherLessons.length === 0) {
        return NextResponse.json({ progress: [], students: [] }, { status: 200 });
      }

      const lessonIds = teacherLessons.map(l => l.id);
      const progressRecords = await db.select().from(studentProgress).where(inArray(studentProgress.lessonId, lessonIds));

      const studentIds = [...new Set(progressRecords.map(p => p.studentId))];
      let studentsData: any[] = [];
      if (studentIds.length > 0) {
        studentsData = await db.select().from(users).where(inArray(users.id, studentIds));
      }

      const lessonMap = new Map(teacherLessons.map(l => [l.id, l]));
      const studentMap = new Map(studentsData.map(s => [s.id, s]));

      const progressWithDetails = progressRecords.map(p => ({
        ...p,
        studentName: studentMap.get(p.studentId)?.name || 'غير معروف',
        lessonTitle: lessonMap.get(p.lessonId)?.title || 'غير معروف'
      }));

      const students = studentsData.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        grade: s.grade || ''
      }));

      return NextResponse.json({ progress: progressWithDetails, students }, { status: 200 });
    }

    if (!studentIdParam) {
      return NextResponse.json({ error: 'Student ID or Teacher ID is required' }, { status: 400 });
    }

    const studentId = parseInt(studentIdParam);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Valid student ID is required' }, { status: 400 });
    }

    const student = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (student.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student[0].role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 400 });
    }

    const progressRecords = await db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));
    const examAttemptsRecords = await db.select().from(examAttempts).where(eq(examAttempts.studentId, studentId));

    const totalLessonsWatched = progressRecords.filter(r => r.videoWatched === true).length;
    const totalHomeworkCompleted = progressRecords.filter(r => r.homeworkCompleted === true).length;
    const totalExamsTaken = examAttemptsRecords.length;

    let averageScore = 0;
    let level = 'لم يبدأ بعد';

    if (totalExamsTaken > 0) {
      const totalScorePercentage = examAttemptsRecords.reduce((sum, attempt) => {
        return sum + (attempt.score / attempt.totalQuestions) * 100;
      }, 0);
      averageScore = Math.round((totalScorePercentage / totalExamsTaken) * 10) / 10;

      if (averageScore >= 90) level = 'ممتاز';
      else if (averageScore >= 80) level = 'جيد جداً';
      else if (averageScore >= 70) level = 'جيد';
      else if (averageScore >= 60) level = 'مقبول';
      else level = 'ضعيف';
    }

    return NextResponse.json({
      studentId,
      totalLessonsWatched,
      totalHomeworkCompleted,
      totalExamsTaken,
      averageScore,
      level
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}