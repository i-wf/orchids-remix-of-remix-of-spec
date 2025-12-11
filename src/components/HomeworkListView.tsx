"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { LessonDetailModal } from './LessonDetailModal';

interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  studyPdfUrl: string | null;
  homeworkPdfUrl: string | null;
  grade: string;
}

interface Progress {
  id: number;
  studentId: number;
  lessonId: number;
  homeworkCompleted: boolean;
  homeworkScore: number | null;
}

interface HomeworkListViewProps {
  studentId: number;
  grade: string;
}

export function HomeworkListView({ studentId, grade }: HomeworkListViewProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId, grade]);

  const fetchData = async () => {
    try {
      // Fetch lessons with homework
      const lessonsResponse = await fetch(`/api/lessons?grade=${grade}&limit=100`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        const lessonsWithHomework = lessonsData.filter((l: Lesson) => l.homeworkPdfUrl);
        setLessons(lessonsWithHomework);

        // Fetch progress for these lessons
        const progressPromises = lessonsWithHomework.map((lesson: Lesson) =>
          fetch(`/api/student-progress?studentId=${studentId}&lessonId=${lesson.id}`).then(res => res.json())
        );
        const progressData = await Promise.all(progressPromises);
        const flatProgress = progressData.flat();
        setProgress(flatProgress);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForLesson = (lessonId: number) => {
    return progress.find(p => p.lessonId === lessonId);
  };

  const getStatusIcon = (lessonId: number) => {
    const prog = getProgressForLesson(lessonId);
    if (!prog || !prog.homeworkCompleted) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    if (prog.homeworkScore && prog.homeworkScore >= 50) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (lessonId: number) => {
    const prog = getProgressForLesson(lessonId);
    if (!prog || !prog.homeworkCompleted) {
      return 'لم يتم الحل';
    }
    return `تم الحل: ${prog.homeworkScore}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد واجبات</h3>
        <p className="text-muted-foreground">لم يتم إضافة واجبات لصفك الدراسي بعد</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">الواجبات المتاحة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessons.map((lesson) => (
          <Card
            key={lesson.id}
            className="p-6 hover:border-primary cursor-pointer transition-colors"
            onClick={() => setSelectedLesson(lesson)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(lesson.id)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground mb-2">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {lesson.description || 'لا يوجد وصف'}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {getStatusText(lesson.id)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          studentId={studentId}
          onClose={() => {
            setSelectedLesson(null);
            fetchData(); // Refresh data after modal closes
          }}
        />
      )}
    </div>
  );
}
