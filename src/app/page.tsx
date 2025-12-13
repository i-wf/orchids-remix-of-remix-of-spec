"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, GraduationCap, BookOpen, Users, Sparkles, Trophy, Brain, Star, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow';

export const dynamic = 'force-dynamic';

interface FeaturedTeacher {
  id: number;
  name: string;
  subjects: string | null;
  centerName: string | null;
  averageRating: number;
  totalRatings: number;
  lessonsCount: number;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [featuredTeachers, setFeaturedTeachers] = useState<FeaturedTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchFeaturedTeachers();
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [mounted, featuredTeachers]);

  const fetchFeaturedTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher&limit=6');
      if (response.ok) {
        const teachers = await response.json();
        const teachersWithRatings: FeaturedTeacher[] = [];

        for (const teacher of teachers.slice(0, 6)) {
          const ratingsRes = await fetch(`/api/ratings?teacherId=${teacher.id}&limit=100`);
          const foldersRes = await fetch(`/api/lesson-folders?teacherId=${teacher.id}&limit=100`);

          let avgRating = 0,totalRatings = 0,lessonsCount = 0;

          if (ratingsRes.ok) {
            const ratings = await ratingsRes.json();
            totalRatings = ratings.length;
            if (totalRatings > 0) {
              avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings;
            }
          }

          if (foldersRes.ok) {
            const folders = await foldersRes.json();
            lessonsCount = folders.length;
          }

          teachersWithRatings.push({
            id: teacher.id,
            name: teacher.name,
            subjects: teacher.subjects,
            centerName: teacher.centerName,
            averageRating: avgRating,
            totalRatings,
            lessonsCount
          });
        }

        setFeaturedTeachers(teachersWithRatings);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <div className="relative min-h-screen flex items-center justify-center">
        <EtheralShadow
          color="rgba(64, 96, 144, 0.5)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
          className="absolute inset-0"
        />
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-6xl mx-auto">
          <div className="mb-6 bg-primary/10 hover:bg-primary/15 text-primary backdrop-blur-md border border-primary/20 uppercase tracking-wider font-medium flex items-center gap-2 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-light tracking-[0.18em] text-primary/80">
              تعليم
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="text-xs font-light tracking-tight text-primary">
              ذكاء اصطناعي
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl max-w-4xl font-light tracking-tight text-foreground mb-4">
            منصة التعليم المصرية
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 font-light">
            منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي - من الصف الرابع الابتدائي إلى الثالث الثانوي
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="px-8 py-3 rounded-xl text-base font-medium backdrop-blur-lg bg-primary hover:bg-primary/90 shadow-lg transition-all cursor-pointer">
              انضم معنا
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
              className="px-8 py-3 rounded-xl text-base font-medium border-muted-foreground/30 text-foreground hover:bg-muted backdrop-blur-lg transition-all cursor-pointer">
              سجل دخولك
            </Button>
          </div>
          
          <ul className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-light tracking-tight text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              دروس تفاعلية
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              ملخصات ذكية
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              مساعد تعليمي
            </li>
          </ul>
        </div>
      </div>
    </div>);

}