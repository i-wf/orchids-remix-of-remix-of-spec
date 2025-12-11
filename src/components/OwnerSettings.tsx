"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OwnerSettingsProps {
  onBack: () => void;
}

export function OwnerSettings({ onBack }: OwnerSettingsProps) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Change User Password section
  const [targetUserId, setTargetUserId] = useState('');
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState('');
  const [targetSuccess, setTargetSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setSuccess('تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setError(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTargetError('');
    setTargetSuccess('');

    if (!targetUserId || !targetNewPassword) {
      setTargetError('يرجى إدخال معرف المستخدم وكلمة المرور الجديدة');
      return;
    }

    if (targetNewPassword.length < 6) {
      setTargetError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setTargetLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(targetUserId),
          newPassword: targetNewPassword,
          isOwner: true,
        }),
      });

      if (response.ok) {
        setTargetSuccess('تم تغيير كلمة مرور المستخدم بنجاح');
        setTargetUserId('');
        setTargetNewPassword('');
      } else {
        const data = await response.json();
        setTargetError(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      setTargetError('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setTargetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Profile Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">معلومات الحساب</h2>
              <p className="text-sm text-muted-foreground">بيانات حسابك الشخصية</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>الاسم</Label>
              <Input value={user?.name || ''} disabled className="text-right" />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={user?.phone || ''} disabled className="text-right" />
            </div>
            <div>
              <Label>الدور</Label>
              <Input value="مالك" disabled className="text-right" />
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">تغيير كلمة المرور</h2>
              <p className="text-sm text-muted-foreground">قم بتحديث كلمة المرور الخاصة بك</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </form>
        </Card>

        {/* Change User Password (Owner Only) */}
        <Card className="p-6 border-primary/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">تغيير كلمة مرور مستخدم</h2>
              <p className="text-sm text-muted-foreground">صلاحية المالك فقط</p>
            </div>
          </div>

          <form onSubmit={handleChangeUserPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUserId">معرف المستخدم (User ID)</Label>
              <Input
                id="targetUserId"
                type="number"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="مثال: 5"
                required
                disabled={targetLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetNewPassword">كلمة المرور الجديدة</Label>
              <Input
                id="targetNewPassword"
                type="password"
                value={targetNewPassword}
                onChange={(e) => setTargetNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={targetLoading}
              />
            </div>

            {targetError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {targetError}
              </div>
            )}

            {targetSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                {targetSuccess}
              </div>
            )}

            <Button type="submit" disabled={targetLoading} className="w-full">
              {targetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                'تغيير كلمة المرور'
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}