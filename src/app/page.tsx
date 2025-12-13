"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow';
import { DemoOne } from '@/components/ui/demo-hero';
import DemoSpotlight from '@/components/ui/demo-spotlight';

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

      <DemoOne />
      
      <DemoSpotlight />
    </div>);

}