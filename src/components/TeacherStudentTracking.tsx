"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Users, BookOpen, ClipboardCheck, Trophy, Search, Loader2, ChevronDown, ChevronUp, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeacherStudentTrackingProps {
  onBack: () => void;
  teacherId: number;
}

interface Student {
  id: number;
  name: string;
  phone: string;
  grade: string;
}

interface StudentProgress {
  studentId: number;
  studentName: string;
  lessonTitle: string;
  lessonId: number;
  videoWatched: boolean;
  homeworkCompleted: boolean;
  homeworkScore: number | null;
  lastAccessed: string;
}

interface ExamAttempt {
  id: number;
  studentId: number;
  studentName: string;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

export function TeacherStudentTracking({ onBack, teacherId }: TeacherStudentTrackingProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progressRes, examRes] = await Promise.all([
        fetch(`/api/student-progress/analytics?teacherId=${teacherId}`),
        fetch(`/api/exam-attempts/analytics?teacherId=${teacherId}`)
      ]);

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progress || []);
        const uniqueStudents = progressData.students || [];
        setStudents(uniqueStudents);
      }

      if (examRes.ok) {
        const examData = await examRes.json();
        setExamAttempts(examData.attempts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      '3-secondary': 'الثالث الثانوي'
    };
    return labels[grade] || grade;
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  const getStudentProgress = (studentId: number) => {
    return progress.filter(p => p.studentId === studentId);
  };

  const getStudentExams = (studentId: number) => {
    return examAttempts.filter(e => e.studentId === studentId);
  };

  const calculateStudentStats = (studentId: number) => {
    const studentProgress = getStudentProgress(studentId);
    const studentExams = getStudentExams(studentId);
    
    const watchedVideos = studentProgress.filter(p => p.videoWatched).length;
    const completedHomework = studentProgress.filter(p => p.homeworkCompleted).length;
    const avgExamScore = studentExams.length > 0 
      ? studentExams.reduce((sum, e) => sum + (e.score / e.totalQuestions) * 100, 0) / studentExams.length
      : 0;

    return { watchedVideos, completedHomework, avgExamScore, totalLessons: studentProgress.length, totalExams: studentExams.length };
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-animate">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">متابعة الطلاب</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{progress.filter(p => p.videoWatched).length}</p>
                <p className="text-xs text-muted-foreground">فيديوهات مشاهدة</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{progress.filter(p => p.homeworkCompleted).length}</p>
                <p className="text-xs text-muted-foreground">واجبات مكتملة</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{examAttempts.length}</p>
                <p className="text-xs text-muted-foreground">محاولات امتحان</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن طالب بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="students">الطلاب</TabsTrigger>
            <TabsTrigger value="homework">الواجبات</TabsTrigger>
            <TabsTrigger value="exams">الامتحانات</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا يوجد طلاب مشتركين حالياً</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const stats = calculateStudentStats(student.id);
                  const isExpanded = expandedStudent === student.id;

                  return (
                    <Card key={student.id} className="overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{getGradeLabel(student.grade)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-green-500">
                                <BookOpen className="w-4 h-4" />
                                {stats.watchedVideos}
                              </span>
                              <span className="flex items-center gap-1 text-orange-500">
                                <ClipboardCheck className="w-4 h-4" />
                                {stats.completedHomework}
                              </span>
                              <span className="flex items-center gap-1 text-purple-500">
                                <Trophy className="w-4 h-4" />
                                {stats.avgExamScore.toFixed(0)}%
                              </span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-secondary/20">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="p-3 bg-background rounded-lg text-center">
                              <p className="text-xl font-bold text-green-500">{stats.watchedVideos}</p>
                              <p className="text-xs text-muted-foreground">فيديوهات</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg text-center">
                              <p className="text-xl font-bold text-orange-500">{stats.completedHomework}</p>
                              <p className="text-xs text-muted-foreground">واجبات</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg text-center">
                              <p className="text-xl font-bold text-purple-500">{stats.totalExams}</p>
                              <p className="text-xs text-muted-foreground">امتحانات</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg text-center">
                              <p className="text-xl font-bold text-blue-500">{stats.avgExamScore.toFixed(0)}%</p>
                              <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-foreground mb-2">تقدم الدروس:</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {getStudentProgress(student.id).map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg text-sm">
                                <span className="truncate flex-1">{p.lessonTitle}</span>
                                <div className="flex items-center gap-2">
                                  {p.videoWatched ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  {p.homeworkCompleted && (
                                    <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded">
                                      واجب: {p.homeworkScore || 0}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="homework" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {progress.filter(p => p.homeworkCompleted).length === 0 ? (
                  <Card className="p-8 text-center">
                    <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد واجبات مكتملة</p>
                  </Card>
                ) : (
                  progress.filter(p => p.homeworkCompleted).map((p, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{p.studentName}</p>
                          <p className="text-sm text-muted-foreground">{p.lessonTitle}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-500">{p.homeworkScore || 0}%</p>
                          <p className="text-xs text-muted-foreground">الدرجة</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exams" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : examAttempts.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد محاولات امتحان</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {examAttempts.map((attempt) => (
                  <Card key={attempt.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{attempt.studentName}</p>
                        <p className="text-sm text-muted-foreground">{attempt.lessonTitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(attempt.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-500">
                          {attempt.score}/{attempt.totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((attempt.score / attempt.totalQuestions) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
