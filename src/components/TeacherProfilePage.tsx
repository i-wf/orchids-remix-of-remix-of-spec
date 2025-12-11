"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, BookOpen, Users, MessageSquare, Award, Building2, Calendar } from 'lucide-react';
import Image from 'next/image';

interface TeacherProfilePageProps {
  onBack: () => void;
  teacherId: number;
}

interface Rating {
  id: number;
  rating: number;
  reviewText: string | null;
  studentId: number;
  createdAt: string;
}

interface Folder {
  id: number;
  name: string;
  grade: string;
}

interface Lesson {
  id: number;
  title: string;
  isFree: boolean;
  folderId: number;
}

interface TeacherInfo {
  id: number;
  name: string;
  subjects: string | null;
  centerName: string | null;
  groupName: string | null;
}

export function TeacherProfilePage({ onBack, teacherId }: TeacherProfilePageProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    try {
      const [teacherRes, ratingsRes, foldersRes] = await Promise.all([
        fetch(`/api/users?id=${teacherId}`),
        fetch(`/api/ratings?teacherId=${teacherId}&limit=100`),
        fetch(`/api/lesson-folders?teacherId=${teacherId}&limit=100`)
      ]);

      if (teacherRes.ok) {
        const teacher = await teacherRes.json();
        setTeacherInfo(teacher);
      }

      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setRatings(ratingsData);
        if (ratingsData.length > 0) {
          const total = ratingsData.reduce((sum: number, r: Rating) => sum + r.rating, 0);
          setAverageRating(total / ratingsData.length);
        }
      }

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
        
        let allLessons: Lesson[] = [];
        for (const folder of foldersData) {
          const lessonsRes = await fetch(`/api/lessons?folderId=${folder.id}&limit=100`);
          if (lessonsRes.ok) {
            const lessonsData = await lessonsRes.json();
            allLessons = [...allLessons, ...lessonsData];
          }
        }
        setLessons(allLessons);
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

  const freeLessons = lessons.filter(l => l.isFree);
  const subjectsArray = teacherInfo?.subjects ? teacherInfo.subjects.split(',').map(s => s.trim()) : [];
  const uniqueGrades = [...new Set(folders.map(f => f.grade))];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-animate">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">ملفي الشخصي</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="relative rounded-2xl overflow-hidden h-48 sm:h-64">
          <Image
            src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=400&fit=crop"
            alt="Cover"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 right-4 flex items-end gap-4">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"
                alt={teacherInfo?.name || 'المعلم'}
                fill
                className="object-cover"
              />
            </div>
            <div className="pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{teacherInfo?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                ))}
                <span className="text-sm text-yellow-500">({averageRating.toFixed(1)})</span>
                <span className="text-sm text-muted-foreground">• {ratings.length} تقييم</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center card-hover">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{folders.length}</p>
            <p className="text-sm text-muted-foreground">مواد</p>
          </Card>
          <Card className="p-4 text-center card-hover">
            <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{lessons.length}</p>
            <p className="text-sm text-muted-foreground">حصص</p>
          </Card>
          <Card className="p-4 text-center card-hover">
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{freeLessons.length}</p>
            <p className="text-sm text-muted-foreground">حصص مجانية</p>
          </Card>
          <Card className="p-4 text-center card-hover">
            <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{ratings.length}</p>
            <p className="text-sm text-muted-foreground">تقييمات</p>
          </Card>
        </div>

        {(teacherInfo?.centerName || teacherInfo?.groupName) && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              {teacherInfo.centerName && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                  <Building2 className="w-4 h-4" />
                  <span>{teacherInfo.centerName}</span>
                </div>
              )}
              {teacherInfo.groupName && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
                  <Users className="w-4 h-4" />
                  <span>{teacherInfo.groupName}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {subjectsArray.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              المواد التي أدرسها
            </h3>
            <div className="flex flex-wrap gap-2">
              {subjectsArray.map((subject, index) => (
                <span key={index} className="px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
                  📚 {subject}
                </span>
              ))}
            </div>
          </Card>
        )}

        {uniqueGrades.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3">الصفوف الدراسية</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueGrades.map((grade, index) => (
                <span key={index} className="px-4 py-2 bg-secondary text-foreground rounded-full">
                  {getGradeLabel(grade)}
                </span>
              ))}
            </div>
          </Card>
        )}

        {freeLessons.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              الحصص المجانية
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {freeLessons.slice(0, 6).map((lesson) => {
                const folder = folders.find(f => f.id === lesson.folderId);
                return (
                  <div key={lesson.id} className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                    <p className="font-medium text-foreground">{lesson.title}</p>
                    {folder && <p className="text-sm text-muted-foreground">{folder.name} • {getGradeLabel(folder.grade)}</p>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            التقييمات والتعليقات
          </h3>
          {ratings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد تقييمات بعد</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= rating.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(rating.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  {rating.reviewText && (
                    <p className="text-foreground">{rating.reviewText}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}