"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, User, Phone, GraduationCap, Save, Loader2, Lock, Camera, Upload, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface StudentSettingsProps {
  onBack: () => void;
}

const GRADES = [
  { value: '4-primary', label: 'الرابع الابتدائي' },
  { value: '5-primary', label: 'الخامس الابتدائي' },
  { value: '6-primary', label: 'السادس الابتدائي' },
  { value: '1-preparatory', label: 'الأول الإعدادي' },
  { value: '2-preparatory', label: 'الثاني الإعدادي' },
  { value: '3-preparatory', label: 'الثالث الإعدادي' },
  { value: '1-secondary', label: 'الأول الثانوي' },
  { value: '2-secondary', label: 'الثاني الثانوي' },
  { value: '3-secondary', label: 'الثالث الثانوي' },
];

export function StudentSettings({ onBack }: StudentSettingsProps) {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [grade, setGrade] = useState(user?.grade || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجا');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacherId', user?.id?.toString() || '');
    formData.append('fileType', 'image');

    try {
      const response = await fetch('/api/teacher-uploads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.fileUrl);
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error('فشل رفع الصورة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/users?id=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, grade, profileImage }),
      });

      if (response.ok) {
        toast.success('تم حفظ التغييرات بنجاح');
        const updatedUser = { ...user!, name, phone, grade, profileImage };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'كلمة المرور الحالية غير صحيحة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowRight className="w-5 h-5 ml-2" />
            رجوع
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">الإعدادات</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Image Section */}
        <Card className="p-4 sm:p-6 rounded-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">الصورة الشخصية</h2>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              اضغط على الكاميرا لتغيير صورتك الشخصية
            </p>
          </div>
        </Card>

        {/* Personal Info */}
        <Card className="p-4 sm:p-6 rounded-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">المعلومات الشخصية</h2>

          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                className="text-right"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم هاتفك"
                className="text-right"
                dir="ltr"
              />
            </div>

            {/* Grade */}
            {user?.role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="grade" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  الصف الدراسي
                </Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر الصف الدراسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-4 sm:p-6 rounded-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">تغيير كلمة المرور</h2>

          <div className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور الحالية
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="text-right"
                autoComplete="off"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور الجديدة
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="text-right"
                autoComplete="off"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                تأكيد كلمة المرور الجديدة
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                className="text-right"
                autoComplete="off"
              />
            </div>

            {/* Change Password Button */}
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword}
              variant="secondary"
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التغيير...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 ml-2" />
                  تغيير كلمة المرور
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Sign Out Section */}
        <Card className="p-4 sm:p-6 rounded-2xl border-red-500/20">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">تسجيل الخروج</h2>
          <p className="text-sm text-muted-foreground mb-4">
            سيتم تسجيل خروجك من حسابك على هذا الجهاز
          </p>
          <Button 
            onClick={logout}
            variant="destructive"
            className="w-full rounded-xl"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </Card>
      </main>
    </div>
  );
}