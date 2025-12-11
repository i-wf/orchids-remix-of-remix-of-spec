"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, UserPlus, Copy, Check, Trash2, Users, Loader2, Settings, BookOpen, FileQuestion, ClipboardList, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface SecretaryManagementProps {
  onBack: () => void;
  teacherId: number;
}

interface SecretaryCode {
  id: number;
  code: string;
  secretaryName: string;
  used: boolean;
  usedByUserId: number | null;
  createdAt: string;
}

interface SecretaryPermission {
  id?: number;
  secretaryId: number;
  secretaryName?: string;
  canCreateFlashcards: boolean;
  canCreateHomework: boolean;
  canCreateExams: boolean;
  canEditLessons: boolean;
}

export function SecretaryManagement({ onBack, teacherId }: SecretaryManagementProps) {
  const [codes, setCodes] = useState<SecretaryCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [secretaryName, setSecretaryName] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<SecretaryPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState<number | null>(null);

  useEffect(() => {
    fetchCodes();
    fetchPermissions();
  }, [teacherId]);

  const fetchCodes = async () => {
    try {
      const response = await fetch(`/api/secretary-access-codes?teacherId=${teacherId}`);
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

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await fetch(`/api/secretary-permissions?teacherId=${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const generateCode = async () => {
    if (!secretaryName.trim()) {
      toast.error('من فضلك أدخل اسم السكرتير');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/secretary-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, secretaryName: secretaryName.trim() })
      });

      if (response.ok) {
        const newCode = await response.json();
        setCodes([newCode, ...codes]);
        setSecretaryName('');
        toast.success('تم إنشاء كود السكرتير بنجاح');
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
      const response = await fetch(`/api/secretary-access-codes?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setCodes(codes.filter(c => c.id !== id));
        toast.success('تم حذف الكود بنجاح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود');
    }
  };

  const updatePermission = async (secretaryId: number, field: string, value: boolean) => {
    setSavingPermissions(secretaryId);
    try {
      const currentPerm = permissions.find(p => p.secretaryId === secretaryId);
      const response = await fetch('/api/secretary-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretaryId,
          teacherId,
          canCreateFlashcards: field === 'canCreateFlashcards' ? value : currentPerm?.canCreateFlashcards ?? false,
          canCreateHomework: field === 'canCreateHomework' ? value : currentPerm?.canCreateHomework ?? false,
          canCreateExams: field === 'canCreateExams' ? value : currentPerm?.canCreateExams ?? false,
          canEditLessons: field === 'canEditLessons' ? value : currentPerm?.canEditLessons ?? false,
        })
      });

      if (response.ok) {
        toast.success('تم تحديث الصلاحيات');
        fetchPermissions();
      } else {
        toast.error('فشل تحديث الصلاحيات');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    } finally {
      setSavingPermissions(null);
    }
  };

  const usedCodes = codes.filter(c => c.used);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-animate">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">إدارة السكرتير</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Create Secretary Code */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إضافة سكرتير جديد</h2>
              <p className="text-sm text-muted-foreground">أنشئ كود وصول للسكرتير للمساعدة في إدارة الطلاب</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>اسم السكرتير</Label>
              <Input value={secretaryName} onChange={(e) => setSecretaryName(e.target.value)} placeholder="أدخل اسم السكرتير" className="mt-1" />
            </div>
            <Button onClick={generateCode} disabled={creating} className="w-full btn-animate">
              {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
              إنشاء كود السكرتير
            </Button>
          </div>
        </Card>

        {/* Secretary Permissions */}
        {usedCodes.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">صلاحيات السكرتير</h2>
            </div>

            {loadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {usedCodes.map((code) => {
                  const perm = permissions.find(p => p.secretaryId === code.usedByUserId);
                  const isSaving = savingPermissions === code.usedByUserId;

                  return (
                    <div key={code.id} className="p-4 border border-border rounded-lg">
                      <h3 className="font-bold text-foreground mb-4">{code.secretaryName}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">إنشاء بطاقات تعليمية</span>
                          </div>
                          <Switch
                            checked={perm?.canCreateFlashcards ?? false}
                            onCheckedChange={(v) => code.usedByUserId && updatePermission(code.usedByUserId, 'canCreateFlashcards', v)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileQuestion className="w-4 h-4 text-green-500" />
                            <span className="text-sm">إنشاء أسئلة واجب</span>
                          </div>
                          <Switch
                            checked={perm?.canCreateHomework ?? false}
                            onCheckedChange={(v) => code.usedByUserId && updatePermission(code.usedByUserId, 'canCreateHomework', v)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-orange-500" />
                            <span className="text-sm">إنشاء امتحانات</span>
                          </div>
                          <Switch
                            checked={perm?.canCreateExams ?? false}
                            onCheckedChange={(v) => code.usedByUserId && updatePermission(code.usedByUserId, 'canCreateExams', v)}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">تعديل الدروس</span>
                          </div>
                          <Switch
                            checked={perm?.canEditLessons ?? false}
                            onCheckedChange={(v) => code.usedByUserId && updatePermission(code.usedByUserId, 'canEditLessons', v)}
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Secretary Codes List */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">أكواد السكرتير</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لم تقم بإنشاء أي أكواد بعد</p>
          ) : (
            <div className="space-y-3">
              {codes.map((code) => (
                <div key={code.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{code.secretaryName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-background px-2 py-1 rounded font-mono">{code.code}</code>
                        {code.used ? (
                          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">مستخدم</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full">غير مستخدم</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        تم الإنشاء: {new Date(code.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyCode(code.code, code.id)} className="btn-animate">
                        {copiedId === code.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      {!code.used && (
                        <Button variant="outline" size="sm" onClick={() => deleteCode(code.id)} className="btn-animate text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}