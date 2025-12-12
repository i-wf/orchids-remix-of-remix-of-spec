"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, GraduationCap, TrendingUp, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalStudents: number;
  totalSubscriptions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  topTeachers: Array<{
    id: number;
    name: string;
    studentsCount: number;
    revenue: number;
  }>;
}

export function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [studentsRes, subsRes] = await Promise.all([
        fetch('/api/users?role=student'),
        fetch('/api/subscriptions')
      ]);

      if (!studentsRes.ok || !subsRes.ok) throw new Error('Failed to fetch');

      const students = await studentsRes.json();
      const subscriptions = await subsRes.json();

      const activeSubscriptions = subscriptions.filter((s: any) => s.isActive);
      const totalRevenue = subscriptions.reduce((sum: number, s: any) => sum + (s.monthlyPrice || 0), 0);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyRevenue = subscriptions
        .filter((s: any) => {
          const subDate = new Date(s.createdAt);
          return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, s: any) => sum + (s.monthlyPrice || 0), 0);

      setAnalytics({
        totalStudents: students.length,
        totalSubscriptions: subscriptions.length,
        totalRevenue,
        activeSubscriptions: activeSubscriptions.length,
        monthlyRevenue,
        topTeachers: []
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-muted-foreground">
        فشل تحميل البيانات
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الطلاب
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">طالب مسجل</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الاشتراكات النشطة
              </CardTitle>
              <GraduationCap className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">من {analytics.totalSubscriptions} إجمالي</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الإيرادات الشهرية
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">جنيه مصري</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الإيرادات
              </CardTitle>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">جنيه مصري</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>نظرة عامة</CardTitle>
          <CardDescription>إحصائيات المنصة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm text-muted-foreground">نسبة الاشتراكات النشطة</span>
            <span className="text-sm font-bold">
              {analytics.totalSubscriptions > 0 
                ? Math.round((analytics.activeSubscriptions / analytics.totalSubscriptions) * 100) 
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm text-muted-foreground">متوسط الإيرادات لكل اشتراك</span>
            <span className="text-sm font-bold">
              {analytics.totalSubscriptions > 0 
                ? Math.round(analytics.totalRevenue / analytics.totalSubscriptions) 
                : 0} جنيه
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">متوسط الاشتراكات لكل طالب</span>
            <span className="text-sm font-bold">
              {analytics.totalStudents > 0 
                ? (analytics.totalSubscriptions / analytics.totalStudents).toFixed(2) 
                : 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
