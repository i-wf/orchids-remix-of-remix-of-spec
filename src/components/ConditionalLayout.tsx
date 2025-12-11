"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

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
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}