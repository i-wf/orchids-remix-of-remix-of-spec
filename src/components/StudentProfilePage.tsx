"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, User, Camera, BookOpen, ClipboardCheck, Award, TrendingUp, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Analytics {
  totalLessonsWatched: number;
  totalHomeworkCompleted: number;
  totalExamsTaken: number;
  averageScore: number;
  level: string;
}

interface StudentProfilePageProps {
  studentId: number;
  onBack: () => void;
}

export function StudentProfilePage({ studentId, onBack }: StudentProfilePageProps) {
  const [student, setStudent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [profileImage, setProfileImage] = useState<string>('/default-avatar.png');

  useEffect(() => {
    fetchStudentData();
    fetchAnalytics();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`/api/users?id=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
        setNewName(data.name);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/student-progress/analytics?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        toast.success('تم تحديث الصورة');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async () => {
    try {
      const response = await fetch(`/api/users?id=${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        toast.success('تم تحديث الاسم بنجاح');
        setEditingName(false);
        fetchStudentData();
      } else {
        toast.error('فشل تحديث الاسم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const getLevelColor = (level: string) => {
    if (level === 'ممتاز') return 'text-green-500';
    if (level === 'جيد جداً') return 'text-blue-500';
    if (level === 'جيد') return 'text-yellow-500';
    if (level === 'مقبول') return 'text-orange-500';
    if (level === 'ضعيف') return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getLevelBg = (level: string) => {
    if (level === 'ممتاز') return 'bg-green-500/10 border-green-500/30';
    if (level === 'جيد جداً') return 'bg-blue-500/10 border-blue-500/30';
    if (level === 'جيد') return 'bg-yellow-500/10 border-yellow-500/30';
    if (level === 'مقبول') return 'bg-orange-500/10 border-orange-500/30';
    if (level === 'ضعيف') return 'bg-red-500/10 border-red-500/30';
    return 'bg-muted/10 border-muted/30';
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="text-primary-foreground mb-4 hover:bg-primary-foreground/10">
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>
          
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-foreground/20 shadow-lg animate-pulse-glow">
                <img 
                  src={profileImage} 
                  alt={student.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=256&background=007acc&color=fff`;
                  }}
                />
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Camera className="w-5 h-5 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-right">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="max-w-xs bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30"
                  />
                  <Button size="sm" onClick={handleSaveName} className="bg-primary-foreground text-primary">
                    حفظ
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="text-primary-foreground">
                    إلغاء
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-3xl font-bold text-primary-foreground">{student.name}</h1>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(true)} className="text-primary-foreground">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-primary-foreground/80 mt-1">
                {student.grade && getGradeLabel(student.grade)}
              </p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <User className="w-4 h-4 text-primary-foreground/60" />
                <span className="text-sm text-primary-foreground/80">طالب</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        {/* Level Badge */}
        {analytics && analytics.level !== 'لم يبدأ بعد' && (
          <Card className={`p-6 mb-6 ${getLevelBg(analytics.level)} animate-scale-in`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">المستوى</h3>
                <p className={`text-3xl font-bold ${getLevelColor(analytics.level)}`}>
                  {analytics.level}
                </p>
              </div>
              <Award className={`w-16 h-16 ${getLevelColor(analytics.level)}`} />
            </div>
          </Card>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 card-hover animate-scale-in stagger-item">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الدروس المشاهدة</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.totalLessonsWatched || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-hover animate-scale-in stagger-item">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الواجبات المكتملة</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.totalHomeworkCompleted || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-hover animate-scale-in stagger-item">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الامتحانات</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.totalExamsTaken || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 card-hover animate-scale-in stagger-item">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المعدل</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.averageScore ? `${analytics.averageScore.toFixed(1)}%` : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Message */}
        {analytics && analytics.totalExamsTaken === 0 && (
          <Card className="p-6 text-center bg-primary/5 border-primary/20 animate-slide-up">
            <Award className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-2">ابدأ رحلتك التعليمية!</h3>
            <p className="text-muted-foreground">
              ابدأ بمشاهدة الدروس وحل الواجبات لتحسين مستواك
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

function getGradeLabel(grade: string) {
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
}
