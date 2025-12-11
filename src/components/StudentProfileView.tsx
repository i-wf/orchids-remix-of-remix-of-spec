"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Award, BookOpen, CheckCircle, XCircle, TrendingUp, Calendar, Eye } from 'lucide-react';

interface StudentProfileViewProps {
  studentId: number;
  studentData: {
    name: string;
    phone: string;
    parentPhone?: string;
    grade: string;
    email: string;
  };
}

interface ExamAttempt {
  id: number;
  examId: number;
  studentId: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
  examTitle?: string;
}

interface LessonProgress {
  id: number;
  lessonId: number;
  studentId: number;
  completed: boolean;
  watchedAt: string;
  lessonTitle?: string;
  folderName?: string;
}

export function StudentProfileView({ studentId, studentData }: StudentProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    totalLessonsWatched: 0,
    completedLessons: 0,
  });

  useEffect(() => {
    fetchProfileData();
  }, [studentId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch exam attempts
      const examResponse = await fetch(`/api/exam-attempts?studentId=${studentId}&limit=100`);
      if (examResponse.ok) {
        const examData = await examResponse.json();
        setExamAttempts(examData);

        // Calculate exam stats
        if (examData.length > 0) {
          const totalScore = examData.reduce((sum: number, attempt: ExamAttempt) => {
            const percentage = (attempt.score / attempt.totalQuestions) * 100;
            return sum + percentage;
          }, 0);
          setStats(prev => ({
            ...prev,
            totalExams: examData.length,
            averageScore: totalScore / examData.length,
          }));
        }
      }

      // Fetch lesson progress
      const progressResponse = await fetch(`/api/student-progress?studentId=${studentId}&limit=100`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setLessonProgress(progressData);

        // Calculate lesson stats
        const completed = progressData.filter((p: LessonProgress) => p.completed).length;
        setStats(prev => ({
          ...prev,
          totalLessonsWatched: progressData.length,
          completedLessons: completed,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      '4-primary': 'الرابع الابتدائي',
      '5-primary': 'الخامس الابتدائي',
      '6-primary': 'السادس الابتدائي',
      '1-preparatory': 'الأول الإعدادي',
      '2-preparatory': 'الثاني الإعدادي',
      '3-preparatory': 'الثالث الإعدادي',
      '1-secondary': 'الأول الثانوي',
      '2-secondary': 'الثاني الثانوي',
      '3-secondary': 'الثالث الثانوي',
    };
    return labels[grade] || grade;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Info Section */}
      <Card className="p-6 animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-primary/30 shadow-lg animate-pulse-glow">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">الملف الشخصي</h2>
            <p className="text-sm text-muted-foreground">معلومات الطالب الأساسية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
            <User className="w-5 h-5 text-blue-500 icon-colorful" />
            <div>
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="text-base font-semibold text-foreground">{studentData.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
            <Phone className="w-5 h-5 text-green-500 icon-colorful" />
            <div>
              <p className="text-xs text-muted-foreground">رقم الهاتف</p>
              <p className="text-base font-semibold text-foreground" dir="ltr">{studentData.phone}</p>
            </div>
          </div>

          {studentData.parentPhone && (
            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
              <Phone className="w-5 h-5 text-purple-500 icon-colorful" />
              <div>
                <p className="text-xs text-muted-foreground">رقم ولي الأمر</p>
                <p className="text-base font-semibold text-foreground" dir="ltr">{studentData.parentPhone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
            <BookOpen className="w-5 h-5 text-orange-500 icon-colorful" />
            <div>
              <p className="text-xs text-muted-foreground">الصف الدراسي</p>
              <p className="text-base font-semibold text-foreground">{getGradeLabel(studentData.grade)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Section */}
      <Card className="p-6 animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center border-2 border-purple-500/30">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">إحصائيات الأداء</h2>
            <p className="text-sm text-muted-foreground">ملخص أدائك الأكاديمي</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20 text-center">
            <Award className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-bounce-subtle" />
            <p className="text-2xl font-bold text-foreground">{stats.totalExams}</p>
            <p className="text-xs text-muted-foreground">امتحان مكتمل</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2 animate-bounce-subtle" />
            <p className="text-2xl font-bold text-foreground">{stats.averageScore.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 text-center">
            <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2 animate-bounce-subtle" />
            <p className="text-2xl font-bold text-foreground">{stats.totalLessonsWatched}</p>
            <p className="text-xs text-muted-foreground">درس تم مشاهدته</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20 text-center">
            <CheckCircle className="w-8 h-8 text-orange-500 mx-auto mb-2 animate-bounce-subtle" />
            <p className="text-2xl font-bold text-foreground">{stats.completedLessons}</p>
            <p className="text-xs text-muted-foreground">درس مكتمل</p>
          </div>
        </div>
      </Card>

      {/* Recent Exams */}
      <Card className="p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          الامتحانات الأخيرة
        </h3>

        {examAttempts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لم تقم بأي امتحانات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {examAttempts.slice(0, 5).map((attempt) => {
              const percentage = (attempt.score / attempt.totalQuestions) * 100;
              const isPassed = percentage >= 50;

              return (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isPassed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">امتحان #{attempt.examId}</p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline ml-1" />
                        {new Date(attempt.completedAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                      {percentage.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.score} / {attempt.totalQuestions}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Watched Lessons */}
      <Card className="p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          الدروس المشاهدة
        </h3>

        {lessonProgress.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لم تشاهد أي دروس بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessonProgress.slice(0, 10).map((progress) => (
              <div
                key={progress.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">درس #{progress.lessonId}</p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline ml-1" />
                      {new Date(progress.watchedAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                {progress.completed && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
