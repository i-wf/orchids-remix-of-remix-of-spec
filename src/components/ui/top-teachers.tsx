"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Star, Users, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: number;
  name: string;
  subjects: string;
  profileImage: string | null;
  rating: number;
  totalRatings: number;
  studentCount: number;
  lessonCount: number;
}

export function TopTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTopTeachers();
  }, []);

  const fetchTopTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher&limit=6');
      if (response.ok) {
        const data = await response.json();
        
        const teachersWithStats = await Promise.all(
          data.map(async (teacher: any) => {
            const ratingsRes = await fetch(`/api/ratings?teacherId=${teacher.id}`);
            const ratingsData = ratingsRes.ok ? await ratingsRes.json() : [];
            
            const avgRating = ratingsData.length > 0
              ? ratingsData.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingsData.length
              : 0;

            const foldersRes = await fetch(`/api/lesson-folders?teacherId=${teacher.id}`);
            const foldersData = foldersRes.ok ? await foldersRes.json() : [];
            
            const subscriptionsRes = await fetch(`/api/subscriptions?teacherId=${teacher.id}`);
            const subscriptionsData = subscriptionsRes.ok ? await subscriptionsRes.json() : [];
            
            return {
              ...teacher,
              rating: avgRating,
              totalRatings: ratingsData.length,
              studentCount: subscriptionsData.length || 0,
              lessonCount: foldersData.length || 0,
            };
          })
        );

        const sorted = teachersWithStats
          .filter((t: Teacher) => t.totalRatings > 0)
          .sort((a: Teacher, b: Teacher) => b.rating - a.rating)
          .slice(0, 6);

        setTeachers(sorted);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-2">
              أبرز المدرسين
            </h2>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return null;
  }

  return (
    <div className="py-20 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-2">
            أبرز المدرسين
          </h2>
          <p className="text-muted-foreground text-lg">
            أفضل المدرسين على المنصة بتقييمات الطلاب
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm border-border/50"
              onClick={() => router.push(`/dashboard?view=teacher-profile&teacherId=${teacher.id}`)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  {teacher.profileImage ? (
                    <img
                      src={teacher.profileImage}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/40 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40">
                      <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {teacher.subjects}
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(teacher.rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground mr-2">
                      ({teacher.rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{teacher.studentCount} طالب</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{teacher.lessonCount} دورة</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard?view=teacher-profile&teacherId=${teacher.id}`);
                }}
              >
                عرض الملف الشخصي
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
