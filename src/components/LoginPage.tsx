"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, GraduationCap, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 50) {
      setShowOwnerLogin(true);
      setClickCount(0);
    }

    setTimeout(() => setClickCount(0), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phone, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 122, 204, 0.2), transparent),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(78, 201, 176, 0.1), transparent),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(197, 134, 192, 0.1), transparent),
            linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1e1e1e 100%)
          `
        }} />

      {/* Navigation */}
      <nav className="relative z-20 w-full px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center border-2 border-primary/40 shadow-lg group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
              <GraduationCap className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary via-[#4ec9b0] to-primary bg-clip-text text-transparent">منصة التعليم المصرية</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="btn-animate bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 transition-all">
            <Home className="w-4 h-4 ml-2" />
            الرئيسية
          </Button>
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md p-6 sm:p-8 bg-card/90 backdrop-blur-xl border-white/10 animate-scale-in">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center mb-3 sm:mb-4 border-2 border-primary/40 shadow-lg cursor-pointer hover:bg-primary/20 transition-all active:scale-95 animate-pulse-glow"
              onClick={handleIconClick}
            >
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary animate-icon-bounce icon-colorful" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">منصة التعليم المصرية</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {showOwnerLogin ? 'تسجيل دخول المالك 🔐' : 'تسجيل الدخول'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01234567890"
                required
                disabled={loading}
                className="text-right w-full"
                dir="ltr"
              />
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full transition-all hover:scale-105 btn-animate" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>

            <div className="text-center pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline text-sm transition-colors"
                disabled={loading}
              >
                ليس لديك حساب؟ سجل الآن
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}