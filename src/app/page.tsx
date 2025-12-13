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
      <SyntheticHero
        title="منصة التعليم المصرية"
        description="منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي - من الصف الرابع الابتدائي إلى الثالث الثانوي"
        badgeText="ذكاء اصطناعي"
        badgeLabel="تعليم"
        ctaButtons={[
          { text: "انضم معنا", href: "/register", primary: true },
          { text: "سجل دخولك", href: "/login" }
        ]}
        microDetails={[
          "دروس تفاعلية",
          "ملخصات ذكية",
          "مساعد تعليمي"
        ]}
      />

      {/* Features Section */}
      <div className="py-12 sm:py-20 px-4 bg-gradient-to-b from-background to-card/30 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="scroll-reveal text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-3">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              لماذا تختار منصتنا؟
            </span>
          </h2>
          
          <p className="scroll-reveal text-center text-muted-foreground mb-8 sm:mb-12">
            تجربة تعليمية متكاملة مدعومة بأحدث تقنيات الذكاء الاصطناعي
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="scroll-reveal bg-gradient-to-br from-background/80 to-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/20 card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
                <BookOpen className="w-7 h-7 text-primary animate-float" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                محتوى تعليمي شامل
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                دروس فيديو، ملفات PDF، واجبات تفاعلية وبطاقات تعليمية
              </p>
            </div>

            <div className="scroll-reveal bg-gradient-to-br from-background/80 to-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/20 card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
                <Brain className="w-7 h-7 text-primary animate-float" style={{ animationDelay: '0.5s' }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                ذكاء اصطناعي متقدم
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                ملخصات تلقائية وبطاقات تعليمية مُنشأة بالذكاء الاصطناعي
              </p>
            </div>

            <div className="scroll-reveal bg-gradient-to-br from-background/80 to-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/20 card-hover group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
                <Sparkles className="w-7 h-7 text-primary animate-float" style={{ animationDelay: '1s' }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                مساعد تعليمي ذكي
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                مساعد ذكي متخصص في المنهج المصري للإجابة على أسئلتك
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="scroll-reveal text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 card-hover backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                <Trophy className="w-8 h-8 mx-auto mb-2 animate-bounce-subtle" />
              </div>
              <p className="text-sm text-muted-foreground">تفوق مضمون</p>
            </div>
            <div className="scroll-reveal text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 card-hover backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">10+</div>
              <p className="text-sm text-muted-foreground">مراحل دراسية</p>
            </div>
            <div className="scroll-reveal text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 card-hover backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">دعم مستمر</p>
            </div>
            <div className="scroll-reveal text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 card-hover backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">AI</div>
              <p className="text-sm text-muted-foreground">ذكاء اصطناعي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Teachers Section */}
      {featuredTeachers.length > 0 &&
      <div className="py-12 sm:py-20 px-4 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <h2 className="scroll-reveal text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-3">
              <span className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                ⭐ أبرز المدرسين
              </span>
            </h2>
            <p className="scroll-reveal text-center text-muted-foreground mb-8 sm:mb-12">
              تعلم مع نخبة من أفضل المعلمين في مصر
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTeachers.map((teacher, index) =>
            <Card
              key={teacher.id}
              className="scroll-reveal overflow-hidden card-hover border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-500 group"
              style={{ transitionDelay: `${index * 0.1}s` }}>

                  <div className="relative h-48 sm:h-56">
                    <Image
                  src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1568602471122-7832951cc4c5' : '1507003211169-0a1dd7228f2d'}?w=400&h=300&fit=crop`}
                  alt={teacher.name}
                  fill
                  className="object-cover" />

                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-yellow-500/20 backdrop-blur-sm rounded-full border border-yellow-500/30">
                      {[1, 2, 3, 4, 5].map((star) =>
                  <Star key={star} className={`w-3 h-3 ${star <= Math.round(teacher.averageRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                  )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-1">{teacher.name}</h3>
                    {teacher.subjects &&
                <p className="text-sm text-primary mb-2">📚 {teacher.subjects.split(',')[0]}</p>
                }
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      مدرس متميز بخبرة واسعة في تبسيط المناهج وتحقيق أعلى النتائج للطلاب
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{teacher.lessonsCount} مادة</span>
                      <span>{teacher.totalRatings} تقييم</span>
                    </div>
                    {teacher.centerName &&
                <p className="text-xs text-green-500 mb-3">🏢 {teacher.centerName}</p>
                }
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                      onClick={() => router.push(`/login`)}>
                      <span className="ml-2">150 جنيه</span>
                      <ChevronLeft className="w-4 h-4" />
                      انضم
                    </Button>
                  </div>
                </Card>
            )}
            </div>
          </div>
        </div>
      }

      {/* CTA Section */}
      <div className="py-16 sm:py-24 px-4 bg-gradient-to-t from-card/50 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="scroll-reveal text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              ابدأ رحلتك التعليمية الآن
            </span>
          </h2>
          <p className="scroll-reveal text-base sm:text-lg text-muted-foreground mb-8">
            انضم لآلاف الطلاب الذين حققوا التفوق من خلال منصتنا
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/register')}
            className="scroll-reveal btn-animate bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/30 px-8 py-6 text-lg transition-all hover:scale-105 mobile-scale">

            <GraduationCap className="w-5 h-5 ml-2 animate-bounce-subtle" />
            ابدأ الآن مجاناً
          </Button>
        </div>
      </div>
    </div>);

}