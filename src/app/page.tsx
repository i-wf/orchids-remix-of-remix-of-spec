"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 122, 204, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(78, 201, 176, 0.2) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 8s ease infinite'
        }}
      />
      
      <div className="relative min-h-screen flex items-center justify-center py-16 px-4">
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            perspective: '1200px',
            perspectiveOrigin: 'center center'
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-2xl border border-primary/20 backdrop-blur-sm"
              style={{
                width: '280px',
                height: '380px',
                left: `${15 + (i % 4) * 20}%`,
                top: `${10 + Math.floor(i / 4) * 25}%`,
                background: `linear-gradient(135deg, 
                  rgba(0, 122, 204, ${0.05 + (i * 0.01)}) 0%, 
                  rgba(78, 201, 176, ${0.03 + (i * 0.01)}) 50%,
                  rgba(0, 0, 0, 0.1) 100%)`,
                transform: `rotateY(${i * 3}deg) rotateX(${i * 2}deg) translateZ(${-100 + i * 15}px)`,
                animation: `float-cards ${8 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 20px 60px rgba(0, 122, 204, ${0.1 + (i * 0.01)})`,
                opacity: 0.6 - (i * 0.03)
              }}
            />
          ))}
        </div>

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
        <DemoOne />
        <DemoSpotlight />
      </div>

      <style jsx>{`
        @keyframes float-cards {
          0%, 100% {
            transform: rotateY(var(--rotate-y, 0deg)) rotateX(var(--rotate-x, 0deg)) translateZ(var(--translate-z, 0px)) translateY(0px);
          }
          50% {
            transform: rotateY(var(--rotate-y, 0deg)) rotateX(var(--rotate-x, 0deg)) translateZ(var(--translate-z, 0px)) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}