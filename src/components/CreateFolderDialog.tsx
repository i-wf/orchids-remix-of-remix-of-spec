"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

const GRADES = [
  { value: '4-primary', label: 'الصف الرابع الابتدائي' },
  { value: '5-primary', label: 'الصف الخامس الابتدائي' },
  { value: '6-primary', label: 'الصف السادس الابتدائي' },
  { value: '1-preparatory', label: 'الصف الأول الإعدادي' },
  { value: '2-preparatory', label: 'الصف الثاني الإعدادي' },
  { value: '3-preparatory', label: 'الصف الثالث الإعدادي' },
  { value: '1-secondary', label: 'الصف الأول الثانوي' },
  { value: '2-secondary', label: 'الصف الثاني الثانوي' },
  { value: '3-secondary', label: 'الصف الثالث الثانوي' },
];

interface CreateFolderDialogProps {
  teacherId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFolderDialog({ teacherId, onClose, onSuccess }: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teacherId', teacherId.toString());
      formData.append('fileType', 'image');

      const response = await fetch('/api/teacher-uploads', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCoverImage(data.fileUrl);
        setCoverImagePreview(data.fileUrl);
      } else {
        setError('فشل رفع الصورة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/lesson-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, teacherId, coverImage }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.error || 'فشل إنشاء المادة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء المادة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء مادة جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المادة</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الرياضيات"
              required
              disabled={loading}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">الصف الدراسي</Label>
            <Select value={grade} onValueChange={setGrade} disabled={loading}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="اختر الصف" />
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

          <div className="space-y-2">
            <Label>صورة المادة (اختياري)</Label>
            {coverImagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-32 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2 h-8 w-8"
                  onClick={removeCoverImage}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">جارٍ رفع الصورة...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">اضغط لإضافة صورة</span>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={loading || uploadingImage}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !name || !grade || uploadingImage} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                'إنشاء'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}