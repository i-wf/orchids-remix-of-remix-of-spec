"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DemoOne } from '@/components/ui/demo-hero';
import DemoSpotlight from '@/components/ui/demo-spotlight';
import { TopTeachers } from '@/components/ui/top-teachers';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">        
      <div className="relative min-h-screen flex items-center justify-center py-16 px-4">
        <DemoOne />

        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-1000">
          <div className="mb-2 bg-primary/10 hover:bg-primary/15 text-primary backdrop-blur-md border border-primary/20 uppercase tracking-wider font-medium flex items-center gap-2 px-4 py-1.5 rounded-full mx-auto animate-in fade-in duration-500 delay-100">
            <span className="text-[10px] font-light tracking-[0.18em] text-primary/80">
              تعليم
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="text-xs font-light tracking-tight text-primary">
              ذكاء اصطناعي
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-foreground text-center w-full animate-in slide-in-from-bottom-3 duration-700 delay-200">
            منصة التعليم المصرية
          </h1>
          
          <p className="text-muted-foreground text-lg font-light text-center w-full max-w-2xl mx-auto animate-in fade-in duration-700 delay-300">
            منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي - من الصف الرابع الابتدائي إلى الثالث الثانوي
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full animate-in slide-in-from-bottom-2 duration-700 delay-400">
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
          
          <ul className="flex flex-wrap justify-center gap-6 text-xs font-light tracking-tight text-muted-foreground w-full animate-in fade-in duration-700 delay-500">
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

      <div className="relative space-y-0">
        <TopTeachers />
        <DemoSpotlight />
      </div>
    </div>
  );
}