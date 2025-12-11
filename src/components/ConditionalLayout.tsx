"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';

function NavbarFallback() {
  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-transparent h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
          <div className="flex gap-4">
            <div className="w-24 h-8 rounded bg-primary/10 animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Hide navbar and footer on login/register pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // Hide ONLY footer when user is logged in on dashboard pages (keep navbar)
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin-portal-secret');
  const hideFooter = isAuthPage || (user && isDashboardPage);

  return (
    <>
      {!isAuthPage && (
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
      )}
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}