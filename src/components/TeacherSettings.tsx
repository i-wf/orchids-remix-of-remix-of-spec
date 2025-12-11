"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, User, Lock, Image as ImageIcon, X, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherSettingsProps {
  onBack: () => void;
}

export function TeacherSettings({ onBack }: TeacherSettingsProps) {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [heroImage, setHeroImage] = useState<string | null>(user?.heroImage || null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    file: File, 
    type: 'profile' | 'hero',
    setUploading: (v: boolean) => void,
    setImage: (v: string | null) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    setImageError('');
    setImageSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teacherId', user?.id?.toString() || '');
      formData.append('fileType', 'image');

      const uploadResponse = await fetch('/api/teacher-uploads', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        setImageError('فشل رفع الصورة');
        return;
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.fileUrl;

      const updateField = type === 'profile' ? 'profileImage' : 'heroImage';
      const updateResponse = await fetch(`/api/users?id=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [updateField]: imageUrl }),
      });

      if (updateResponse.ok) {
        setImage(imageUrl);
        setImageSuccess(type === 'profile' ? 'تم تحديث صورة الملف الشخصي' : 'تم تحديث صورة الغلاف');
        if (refreshUser) refreshUser();
      } else {
        setImageError('فشل حفظ الصورة');
      }
    } catch (err) {
      setImageError('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (type: 'profile' | 'hero') => {
    const updateField = type === 'profile' ? 'profileImage' : 'heroImage';
    const setImage = type === 'profile' ? setProfileImage : setHeroImage;
    
    try {
      const response = await fetch(`/api/users?id=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [updateField]: null }),
      });

      if (response.ok) {
        setImage(null);
        setImageSuccess('تم حذف الصورة');
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setImageError('فشل حذف الصورة');
    }
  };

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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">الإعدادات</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {(imageError || imageSuccess) && (
          <div className={`p-3 rounded-lg text-sm ${imageError ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-green-500/10 border border-green-500/20 text-green-600'}`}>
            {imageError || imageSuccess}
          </div>
        )}

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">صور الملف</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">صور ملفك الشخصي وصورة الغلاف</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">صورة الملف الشخصي</Label>
              {profileImage ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6"
                    onClick={() => removeImage('profile')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => profileInputRef.current?.click()}
                >
                  {uploadingProfile ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'profile', setUploadingProfile, setProfileImage);
                }}
              />
            </div>

            <div>
              <Label className="mb-2 block">صورة الغلاف (Hero)</Label>
              {heroImage ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={heroImage} alt="Hero" className="w-full h-32 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2 h-8 w-8"
                    onClick={() => removeImage('hero')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => heroInputRef.current?.click()}
                >
                  {uploadingHero ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">جارٍ رفع الصورة...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">اضغط لإضافة صورة غلاف</span>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'hero', setUploadingHero, setHeroImage);
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">معلومات الحساب</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">بيانات حسابك الشخصية</p>
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
              <Input value="معلم" disabled className="text-right" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">تغيير كلمة المرور</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">قم بتحديث كلمة المرور الخاصة بك</p>
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
      </main>
    </div>
  );
}