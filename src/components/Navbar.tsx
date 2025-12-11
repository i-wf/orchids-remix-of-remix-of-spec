"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, Home, User, Settings, LayoutDashboard, Crown, UserCircle, ChevronUp, BookOpen, Users, Building2, BarChart3 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (pathname === '/') setActiveIndex(0);
    else if (pathname === '/dashboard') setActiveIndex(1);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = user 
    ? [{ href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, requireAuth: true }]
    : [
        { href: '/', label: 'الرئيسية', icon: Home, requireAuth: false },
        { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, requireAuth: true }
      ];

  const handleNavClick = (href: string, index: number) => {
    setActiveIndex(index);
    router.push(href);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    if (user?.role === 'owner') {
      router.push('/admin-portal-secret');
    } else {
      router.push('/dashboard?view=profile');
    }
  };

  const handleSettingsClick = () => {
    router.push('/dashboard?view=settings');
  };

  const hasSubscription = user?.subscriptionType && user.subscriptionType !== 'free';

  const isHomePage = pathname === '/';

  return (
    <>
      <nav className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/30 backdrop-blur-xl shadow-lg shadow-primary/10 border-b border-white/10' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center border-2 border-primary/40 shadow-lg group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
                <GraduationCap className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary via-[#4ec9b0] to-primary bg-clip-text text-transparent">منصة التعليم المصرية</span>
            </button>

            <div className="flex items-center gap-6">
              {navLinks.map((link, index) => {
                if (link.requireAuth && !user) return null;
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href, index)}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 relative group ${
                      isActive ? 'text-primary' : 'text-white/80 hover:text-white'
                    }`}>
                    <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'animate-bounce-subtle' : 'group-hover:scale-110'}`} />
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse-glow" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm animate-scale-in">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-white">{user.name}</span>
                    {hasSubscription && <Crown className="w-4 h-4 text-yellow-500 subscriber-badge" />}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSettingsClick}
                    className="btn-animate bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 transition-all">
                    <Settings className="w-4 h-4 ml-2" />
                    الإعدادات
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/login')}
                    className="btn-animate bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 transition-all">
                    تسجيل الدخول
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push('/register')}
                    className="btn-animate bg-gradient-to-r from-primary to-[#4ec9b0] hover:from-primary/90 hover:to-[#4ec9b0]/90 text-white shadow-lg hover:shadow-xl transition-all">
                    إنشاء حساب
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="hidden md:block h-16" />

      {/* Mobile Top Navbar */}
      <nav className="md:hidden bg-transparent backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-[#4ec9b0]/20 flex items-center justify-center border-2 border-primary/40 shadow-lg animate-pulse-glow">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-[#4ec9b0] bg-clip-text text-transparent">التعليم المصرية</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 animate-scale-in">
                <User className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-white">{user.name.split(' ')[0]}</span>
                {hasSubscription && <Crown className="w-3 h-3 text-yellow-500" />}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push('/login')}
                className="btn-animate bg-gradient-to-r from-primary to-[#4ec9b0] text-white text-xs h-8">
                تسجيل الدخول
              </Button>
            )}
          </div>
        </div>
      </nav>

      {!isHomePage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="bg-gradient-to-t from-[#1a1a2e]/98 via-[#16213e]/98 to-[#1a1a2e]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/20">
            <div className="relative">
              <div className={`grid ${user ? 'grid-cols-3' : 'grid-cols-3'} gap-1 px-2 py-2`}>
                {user && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className={`mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                      pathname === '/dashboard' && !searchParams?.get('view')
                        ? 'active bg-primary/15 text-primary shadow-lg shadow-primary/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}>
                    <div className={`p-1.5 rounded-full transition-all duration-300 ${
                      pathname === '/dashboard' && !searchParams?.get('view') ? 'bg-primary/20 shadow-lg shadow-primary/30' : 'bg-transparent'
                    }`}>
                      <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${pathname === '/dashboard' && !searchParams?.get('view') ? 'scale-110' : ''}`} />
                    </div>
                    <span className="text-[10px] font-medium">التحكم</span>
                  </button>
                )}

                {user ? (
                    <>
                      <button
                        onClick={handleProfileClick}
                        className={`mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                          searchParams?.get('view') === 'profile'
                            ? 'active bg-primary/15 text-primary shadow-lg shadow-primary/20'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}>
                        <div className={`p-1.5 rounded-full relative transition-all duration-300 ${
                          searchParams?.get('view') === 'profile' ? 'bg-primary/20 shadow-lg shadow-primary/30' : 'bg-transparent'
                        }`}>
                          <UserCircle className={`w-5 h-5 transition-transform duration-300 ${searchParams?.get('view') === 'profile' ? 'scale-110' : ''}`} />
                          {hasSubscription && (
                            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 subscriber-badge" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium">الملف</span>
                      </button>

                      <button
                        onClick={handleSettingsClick}
                        className={`mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                          searchParams?.get('view') === 'settings'
                            ? 'active bg-primary/15 text-primary shadow-lg shadow-primary/20'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}>
                        <div className={`p-1.5 rounded-full transition-all duration-300 ${
                          searchParams?.get('view') === 'settings' ? 'bg-primary/20 shadow-lg shadow-primary/30' : 'bg-transparent'
                        }`}>
                          <Settings className={`w-5 h-5 transition-transform duration-300 ${searchParams?.get('view') === 'settings' ? 'scale-110' : ''}`} />
                        </div>
                        <span className="text-[10px] font-medium">الإعدادات</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNavClick('/', 0)}
                        className={`mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                          pathname === '/'
                            ? 'active bg-primary/15 text-primary shadow-lg shadow-primary/20'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}>
                        <div className={`p-1.5 rounded-full transition-all duration-300 ${
                          pathname === '/' ? 'bg-primary/20 shadow-lg shadow-primary/30' : 'bg-transparent'
                        }`}>
                          <Home className={`w-5 h-5 transition-transform duration-300 ${pathname === '/' ? 'scale-110' : ''}`} />
                        </div>
                        <span className="text-[10px] font-medium">الرئيسية</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('/login', -1)}
                        className="mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 text-white/70 hover:text-primary hover:bg-primary/10">
                        <div className="p-1.5 rounded-full bg-transparent">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">دخول</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('/register', -1)}
                        className="mobile-nav-item flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 text-primary hover:bg-primary/10">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">تسجيل</span>
                      </button>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isHomePage && <div className="md:hidden h-20" />}
    </>
  );
}