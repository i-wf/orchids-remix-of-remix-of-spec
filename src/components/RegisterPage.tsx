"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, GraduationCap, Building2, Home, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const GRADES = [
  { value: '4-primary', label: 'الصف الرابع الابتدائي' },
  { value: '5-primary', label: 'الصف الخامس الابتدائي' },
  { value: '6-primary', label: 'الصف السادس الابتدائي' },
  { value: '1-preparatory', label: 'الصف الأول الإعدادي' },
  { value: '2-preparatory', label: 'الصف الثاني الإعدادي' },
  { value: '3-preparatory', label: 'الصف الثالث الإعدادي' },
  { value: '1-secondary', label: 'الصف الأول الثانوي' },
  { value: '2-secondary', label: 'الصف الثاني الثانوي' },
  { value: '3-secondary', label: 'الصف الثالث الثانوي' },
];

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'secretary' | 'owner'>('student');
  const [grade, setGrade] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [centerName, setCenterName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCenterRegister, setShowCenterRegister] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data: any = { phone, password, name, role };
      if (role === 'student') {
        data.grade = grade;
        data.parentPhone = parentPhone;
      }
      if (role === 'teacher' || role === 'secretary') {
        data.accessCode = accessCode;
      }
      if (role === 'owner') {
        data.centerName = centerName;
        data.accessCode = accessCode;
      }

      await register(data);
    } catch (err: any) {
      setError(err.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Center Registration Form
  if (showCenterRegister) {
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
              onClick={() => setShowCenterRegister(false)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300">
              <ArrowRight className="w-5 h-5" />
              <span className="text-sm">رجوع</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center border-2 border-primary/40 shadow-lg group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
                <GraduationCap className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </nav>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md p-6 sm:p-8 bg-card/90 backdrop-blur-xl border-white/10 animate-scale-in">
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500/30 to-yellow-500/20 flex items-center justify-center mb-3 sm:mb-4 border-2 border-orange-500/40 shadow-lg animate-pulse-glow">
                <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 animate-icon-bounce" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">تسجيل سنتر جديد</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base text-center">أدخل بيانات السنتر للتسجيل</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <input type="hidden" value="owner" />

              <div className="space-y-2 animate-slide-up">
                <Label htmlFor="centerName">اسم السنتر</Label>
                <Input
                  id="centerName"
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="أدخل اسم السنتر"
                  required
                  disabled={loading}
                  className="text-right w-full"
                />
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Label htmlFor="ownerName">اسم صاحب السنتر</Label>
                <Input
                  id="ownerName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم صاحب السنتر"
                  required
                  disabled={loading}
                  className="text-right w-full"
                />
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="w-full"
                />
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Label htmlFor="accessCode">كود الدخول</Label>
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="أدخل كود الدخول الخاص بالسنتر"
                  required
                  disabled={loading}
                  className="text-right w-full"
                />
                <p className="text-xs text-muted-foreground">الكود موجود في صفحة الـ Owner</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full transition-all hover:scale-105 btn-animate bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600" 
                disabled={loading}
                onClick={() => setRole('owner')}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ التسجيل...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 ml-2" />
                    تسجيل السنتر
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center mb-3 sm:mb-4 border-2 border-primary/40 shadow-lg animate-pulse-glow">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary animate-icon-bounce icon-colorful" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">منصة التعليم المصرية</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">إنشاء حساب جديد</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                required
                disabled={loading}
                className="text-right w-full"
              />
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="off"
                className="w-full"
              />
            </div>

            <div className="space-y-2 animate-slide-up w-full" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="role">نوع الحساب</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={loading}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="اختر نوع الحساب" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="secretary">سكرتير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'student' && (
              <>
                <div className="space-y-2 animate-scale-in w-full">
                  <Label htmlFor="grade">الصف الدراسي</Label>
                  <Select value={grade} onValueChange={setGrade} disabled={loading}>
                    <SelectTrigger id="grade" className="w-full">
                      <SelectValue placeholder="اختر الصف الدراسي" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {GRADES.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 animate-scale-in">
                  <Label htmlFor="parentPhone">رقم ولي الأمر</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01234567890"
                    required
                    disabled={loading}
                    className="text-right w-full"
                    dir="ltr"
                  />
                </div>
              </>
            )}

            {(role === 'teacher' || role === 'secretary') && (
              <div className="space-y-2 animate-scale-in">
                <Label htmlFor="accessCode">كود الوصول</Label>
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="أدخل كود الوصول"
                  required
                  disabled={loading}
                  className="text-right w-full"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full transition-all hover:scale-105 btn-animate" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التسجيل...
                </>
              ) : (
                'إنشاء حساب'
              )}
            </Button>

            <div className="text-center pt-3 sm:pt-4 space-y-2">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline text-sm transition-colors block w-full"
                disabled={loading}
              >
                لديك حساب؟ سجل دخولك
              </button>

              <button
                type="button"
                onClick={() => setShowCenterRegister(true)}
                className="text-orange-500 hover:text-orange-400 hover:underline text-sm transition-colors flex items-center justify-center gap-2 w-full mt-2 font-semibold"
                disabled={loading}
              >
                <Building2 className="w-4 h-4" />
                التسجيل كسنتر
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}