"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Target, Award, BarChart3, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalyticsData {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

interface StudentAnalyticsProps {
  studentId: number;
  onBack: () => void;
}

export function StudentAnalytics({ studentId, onBack }: StudentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [studentId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/exam-attempts/analytics?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'ممتاز', color: 'text-green-500' };
    if (percentage >= 75) return { label: 'جيد جداً', color: 'text-blue-500' };
    if (percentage >= 60) return { label: 'جيد', color: 'text-yellow-500' };
    return { label: 'يحتاج تحسين', color: 'text-red-500' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowRight className="w-5 h-5 ml-2" />
            رجوع
          </Button>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">تحليل الأداء الدراسي</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !analytics || analytics.totalAttempts === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد بيانات</h3>
            <p className="text-muted-foreground">
              لم تقم بأي محاولات امتحان بعد. ابدأ بحل الامتحانات لرؤية تحليل أدائك
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">إجمالي المحاولات</p>
                    <p className="text-3xl font-bold text-foreground">{analytics.totalAttempts}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">المتوسط</p>
                    <p className="text-3xl font-bold text-foreground">{analytics.averagePercentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">أعلى درجة</p>
                    <p className="text-3xl font-bold text-foreground">{analytics.highestScore}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">نسبة النجاح</p>
                    <p className="text-3xl font-bold text-foreground">{analytics.passRate.toFixed(0)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">تحليل الأداء</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">المتوسط العام</span>
                    <span className={`text-sm font-bold ${getPerformanceLevel(analytics.averagePercentage).color}`}>
                      {getPerformanceLevel(analytics.averagePercentage).label}
                    </span>
                  </div>
                  <Progress value={analytics.averagePercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.averagePercentage.toFixed(1)}% من 100%
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">معدل النجاح</span>
                    <span className="text-sm font-bold text-foreground">
                      {analytics.passRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={analytics.passRate} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    الحد الأدنى للنجاح: 60%
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">أقل درجة</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.lowestScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">أعلى درجة</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.highestScore}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <h3 className="text-lg font-bold text-foreground mb-3">نصائح لتحسين أدائك</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {analytics.averagePercentage < 60 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>ركز على فهم المفاهيم الأساسية قبل حل الامتحانات</span>
                  </li>
                )}
                {analytics.passRate < 70 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>راجع الدروس والملخصات بانتظام</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>استخدم البطاقات التعليمية لتحسين الحفظ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>اطلب المساعدة من الذكاء الاصطناعي عند الحاجة</span>
                </li>
              </ul>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
