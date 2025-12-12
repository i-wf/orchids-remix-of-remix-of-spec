"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminAnalyticsDashboard } from '@/components/admin/AdminAnalyticsDashboard';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AdminViewOnlyPortal() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">لوحة المراقبة</h1>
              <p className="text-sm text-muted-foreground">عرض فقط - لا يوجد صلاحيات تعديل</p>
            </div>
          </div>
        </Card>

        <AdminAnalyticsDashboard />
      </div>
    </div>
  );
}
