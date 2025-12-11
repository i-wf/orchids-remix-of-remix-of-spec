"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Copy, Check, Key } from 'lucide-react';
import { toast } from 'sonner';

interface AccessCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedBy: number | null;
  createdAt: string;
  teacherName?: string;
}

export function OwnerAccessCodesView() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAccessCodes();
  }, []);

  const fetchAccessCodes = async () => {
    try {
      const response = await fetch('/api/teacher-access-codes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      }
    } catch (error) {
      console.error('Error fetching access codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return 'TEACH-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const newCode = generateCode();
      const response = await fetch('/api/teacher-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      });

      if (response.ok) {
        toast.success('تم إنشاء كود جديد بنجاح');
        fetchAccessCodes();
      } else {
        toast.error('فشل إنشاء الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;

    try {
      const response = await fetch(`/api/teacher-access-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('تم حذف الكود بنجاح');
        fetchAccessCodes();
      } else {
        toast.error('فشل حذف الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود');
    }
  };

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('تم نسخ الكود');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">أكواد المعلمين</h2>
          <p className="text-sm text-muted-foreground mt-1">
            إنشاء وإدارة أكواد الوصول للمعلمين
          </p>
        </div>
        <Button onClick={handleGenerateCode} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء كود جديد
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأكواد</p>
              <p className="text-2xl font-bold text-foreground">{codes.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مستخدمة</p>
              <p className="text-2xl font-bold text-foreground">
                {codes.filter((c) => c.isUsed).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متاحة</p>
              <p className="text-2xl font-bold text-foreground">
                {codes.filter((c) => !c.isUsed).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Codes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : codes.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد أكواد</h3>
          <p className="text-muted-foreground mb-4">ابدأ بإنشاء أكواد وصول للمعلمين</p>
          <Button onClick={handleGenerateCode} disabled={generating}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء أول كود
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codes.map((code) => (
            <Card key={code.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {code.isUsed ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20" variant="outline">
                        مستخدم
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20" variant="outline">
                        متاح
                      </Badge>
                    )}
                  </div>

                  <div className="font-mono text-lg font-bold text-foreground bg-muted/50 px-3 py-2 rounded border border-border">
                    {code.code}
                  </div>

                  {code.isUsed && code.teacherName && (
                    <p className="text-sm text-muted-foreground">
                      المعلم: {code.teacherName}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    تاريخ الإنشاء: {formatDate(code.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(code.code, code.id)}
                  >
                    {copiedId === code.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  {!code.isUsed && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCode(code.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
