import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { examAttempts, users, lessons, lessonFolders } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const lessonIdParam = searchParams.get('lessonId');
    const teacherIdParam = searchParams.get('teacherId');

    if (teacherIdParam) {
      const teacherId = parseInt(teacherIdParam);
      if (isNaN(teacherId)) {
        return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
      }

      const teacherFolders = await db.select().from(lessonFolders).where(eq(lessonFolders.teacherId, teacherId));
      if (teacherFolders.length === 0) {
        return NextResponse.json({ attempts: [] }, { status: 200 });
      }

      const folderIds = teacherFolders.map(f => f.id);
      const teacherLessons = await db.select().from(lessons).where(inArray(lessons.folderId, folderIds));
      if (teacherLessons.length === 0) {
        return NextResponse.json({ attempts: [] }, { status: 200 });
      }

      const lessonIds = teacherLessons.map(l => l.id);
      const attempts = await db.select().from(examAttempts).where(inArray(examAttempts.lessonId, lessonIds));

      const studentIds = [...new Set(attempts.map(a => a.studentId))];
      let studentsData: any[] = [];
      if (studentIds.length > 0) {
        studentsData = await db.select().from(users).where(inArray(users.id, studentIds));
      }

      const lessonMap = new Map(teacherLessons.map(l => [l.id, l]));
      const studentMap = new Map(studentsData.map(s => [s.id, s]));

      const attemptsWithDetails = attempts.map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: studentMap.get(a.studentId)?.name || 'غير معروف',
        lessonTitle: lessonMap.get(a.lessonId)?.title || 'غير معروف',
        score: a.score,
        totalQuestions: a.totalQuestions,
        createdAt: a.createdAt
      }));

      return NextResponse.json({ attempts: attemptsWithDetails }, { status: 200 });
    }

    let studentId: number | undefined;
    let lessonId: number | undefined;

    if (studentIdParam) {
      studentId = parseInt(studentIdParam);
      if (isNaN(studentId)) {
        return NextResponse.json({ error: 'Invalid studentId parameter' }, { status: 400 });
      }

      const student = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
      if (student.length === 0 || student[0].role !== 'student') {
        return NextResponse.json({ error: 'Student not found or invalid' }, { status: 400 });
      }
    }

    if (lessonIdParam) {
      lessonId = parseInt(lessonIdParam);
      if (isNaN(lessonId)) {
        return NextResponse.json({ error: 'Invalid lessonId parameter' }, { status: 400 });
      }

      const lesson = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
      if (lesson.length === 0) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 400 });
      }
    }

    const conditions = [];
    if (studentId !== undefined) conditions.push(eq(examAttempts.studentId, studentId));
    if (lessonId !== undefined) conditions.push(eq(examAttempts.lessonId, lessonId));

    let attemptsQuery = db.select().from(examAttempts);
    if (conditions.length > 0) {
      attemptsQuery = attemptsQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const attempts = await attemptsQuery;

    let analytics = {
      totalAttempts: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0
    };

    if (attempts.length > 0) {
      const scores = attempts.map(a => a.score);
      const percentages = attempts.map(a => (a.score / a.totalQuestions) * 100);

      analytics = {
        totalAttempts: attempts.length,
        averageScore: Math.round((scores.reduce((s, sc) => s + sc, 0) / attempts.length) * 100) / 100,
        averagePercentage: Math.round((percentages.reduce((s, p) => s + p, 0) / attempts.length) * 100) / 100,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        passRate: Math.round((attempts.filter(a => (a.score / a.totalQuestions) * 100 >= 60).length / attempts.length) * 10000) / 100
      };
    }

    return NextResponse.json({
      analytics,
      filters: { ...(studentId && { studentId }), ...(lessonId && { lessonId }) }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}