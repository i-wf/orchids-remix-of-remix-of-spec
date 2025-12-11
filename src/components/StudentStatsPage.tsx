"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Clock, Trophy, Video, Loader2, Calendar } from 'lucide-react';

interface StudentStatsPageProps {
  onBack: () => void;
}

interface ExamAttempt {
  id: number;
  lessonId: number;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

interface Attendance {
  id: number;
  liveSessionId: number;
  joinedAt: string;
  sessionTitle: string;
  sessionScheduledAt: string;
}

interface Progress {
  id: number;
  lessonId: number;
  videoWatched: boolean;
  homeworkCompleted: boolean;
  homeworkScore: number | null;
  lastAccessed: string;
}

export function StudentStatsPage({ onBack }: StudentStatsPageProps) {
  const { user } = useAuth();
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [examsRes, attendanceRes, progressRes] = await Promise.all([
        fetch(`/api/exam-attempts?studentId=${user?.id}`),
        fetch(`/api/live-attendance?studentId=${user?.id}`),
        fetch(`/api/student-progress?studentId=${user?.id}`),
      ]);

      if (examsRes.ok) {
        const data = await examsRes.json();
        setExamAttempts(data);
      }

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setAttendance(data);
      }

      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExams = examAttempts.length;
  const avgScore = totalExams > 0
    ? Math.round(examAttempts.reduce((acc, e) => acc + (e.score / e.totalQuestions) * 100, 0) / totalExams)
    : 0;
  const totalAttendance = attendance.length;
  const videosWatched = progress.filter(p => p.videoWatched).length;
  const homeworkCompleted = progress.filter(p => p.homeworkCompleted).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowRight className="w-5 h-5 ml-2" />
            رجوع
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            إحصائياتي
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalExams}</p>
                <p className="text-xs text-muted-foreground">امتحان</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAttendance}</p>
                <p className="text-xs text-muted-foreground">حصة لايف</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{videosWatched}</p>
                <p className="text-xs text-muted-foreground">فيديو</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            نتائج الامتحانات
          </h2>
          {examAttempts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد امتحانات بعد</p>
          ) : (
            <div className="space-y-3">
              {examAttempts.slice(0, 10).map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      (exam.score / exam.totalQuestions) >= 0.7 ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className={`text-sm font-bold ${
                        (exam.score / exam.totalQuestions) >= 0.7 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {Math.round((exam.score / exam.totalQuestions) * 100)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">امتحان #{exam.id}</p>
                      <p className="text-xs text-muted-foreground">{exam.score}/{exam.totalQuestions} إجابة صحيحة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(exam.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            سجل الحضور (اللايفات)
          </h2>
          {attendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا يوجد سجل حضور بعد</p>
          ) : (
            <div className="space-y-3">
              {attendance.slice(0, 10).map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{att.sessionTitle || 'حصة لايف'}</p>
                      <p className="text-xs text-muted-foreground">تم الحضور</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(att.joinedAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
