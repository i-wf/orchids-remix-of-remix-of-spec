"use client";

import { useEffect, useState } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
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

export function TopTeachersSpotlight() {
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
      <div className="w-full flex items-center justify-center bg-gradient-to-br from-[#000] to-[#1A2428] p-4 sm:p-10 py-16">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              أبرز المدرسين
            </h2>
            <p className="text-neutral-400 text-lg">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex items-center justify-center bg-gradient-to-br from-[#000] to-[#1A2428] p-4 sm:p-10 py-16">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            أبرز المدرسين
          </h2>
          <p className="text-neutral-400 text-lg">
            أفضل المدرسين على المنصة بتقييمات الطلاب
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher, index) => (
            <SpotlightCard
              key={teacher.id}
              className={`p-6 h-full flex flex-col gap-4 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-${index * 100}`}
              spotlightColor={
                index % 3 === 0 
                  ? "rgba(14, 165, 233, 0.25)" 
                  : index % 3 === 1 
                  ? "rgba(59, 130, 246, 0.25)" 
                  : "rgba(96, 165, 250, 0.25)"
              }
              onClick={() => router.push(`/dashboard?view=teacher-profile&teacherId=${teacher.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {teacher.profileImage ? (
                    <img
                      src={teacher.profileImage}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30 group-hover:border-blue-400/50 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center border-2 border-blue-500/40">
                      <GraduationCap className="w-8 h-8 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors text-lg">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-2 truncate">
                    {teacher.subjects}
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(teacher.rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-neutral-600'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-neutral-400 mr-2">
                      ({teacher.rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-neutral-400 border-t border-neutral-700/50 pt-4 mt-2">
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
                className="w-full mt-2 bg-blue-900/30 hover:bg-blue-600 text-blue-300 hover:text-white transition-all border border-blue-700/50"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard?view=teacher-profile&teacherId=${teacher.id}`);
                }}
              >
                عرض الملف الشخصي
              </Button>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </div>
  );
}
