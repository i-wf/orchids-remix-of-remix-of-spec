"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Key, Copy, Check, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherSubscriptionCodesProps {
  onBack: () => void;
  teacherId: number;
}

interface SubscriptionCode {
  id: number;
  code: string;
  lessonId: number | null;
  studentId: number | null;
  used: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function TeacherSubscriptionCodes({ onBack, teacherId }: TeacherSubscriptionCodesProps) {
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [teacherId]);

  const fetchCodes = async () => {
    try {
      const response = await fetch(`/api/lesson-access-codes?teacherId=${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/lesson-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          lessonId: null
        })
      });

      if (response.ok) {
        const newCode = await response.json();
        setCodes([newCode, ...codes]);
        toast.success('تم إنشاء كود الاشتراك بنجاح');
      } else {
        toast.error('حدث خطأ أثناء إنشاء الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('تم نسخ الكود');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteCode = async (id: number) => {
    try {
      const response = await fetch(`/api/lesson-access-codes?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCodes(codes.filter(c => c.id !== id));
        toast.success('تم حذف الكود بنجاح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود');
    }
  };

  const unusedCodes = codes.filter(c => !c.used);
  const usedCodes = codes.filter(c => c.used);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-animate">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">مشترك عندي, ادخل الكود</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">أكواد الاشتراك</h2>
              <p className="text-sm text-muted-foreground">أنشئ أكواد للطلاب المشتركين معك للوصول للمحتوى</p>
            </div>
          </div>

          <Button onClick={generateCode} disabled={creating} className="w-full btn-animate bg-green-600 hover:bg-green-700">
            {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Key className="w-4 h-4 ml-2" />}
            إنشاء كود جديد
          </Button>

          <div className="mt-6 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
            <h4 className="font-semibold text-green-500 mb-2">كيف يعمل الكود؟</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ أنشئ كود للطالب المشترك عندك</li>
              <li>✓ أرسل الكود للطالب</li>
              <li>✓ الطالب يدخل الكود في صفحة الاشتراك</li>
              <li>✓ يحصل على وصول كامل لجميع حصصك</li>
            </ul>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">الأكواد المتاحة ({unusedCodes.length})</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : unusedCodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد أكواد متاحة، أنشئ كود جديد</p>
          ) : (
            <div className="space-y-3">
              {unusedCodes.map((code) => (
                <div key={code.id} className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <code className="text-lg bg-background px-3 py-1.5 rounded font-mono text-green-500">{code.code}</code>
                      <p className="text-xs text-muted-foreground mt-2">
                        تم الإنشاء: {new Date(code.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCode(code.code, code.id)}
                        className="btn-animate border-green-500/30 hover:bg-green-500/10"
                      >
                        {copiedId === code.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        <span className="mr-2">نسخ</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                        className="btn-animate text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {usedCodes.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Check className="w-6 h-6 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">الأكواد المستخدمة ({usedCodes.length})</h2>
            </div>
            <div className="space-y-3">
              {usedCodes.map((code) => (
                <div key={code.id} className="p-4 bg-secondary/30 rounded-lg border border-border opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="text-sm bg-background px-2 py-1 rounded font-mono line-through">{code.code}</code>
                      <p className="text-xs text-muted-foreground mt-1">تم الاستخدام</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">مستخدم</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}