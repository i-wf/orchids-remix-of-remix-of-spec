"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Gift, Image, X } from 'lucide-react';
import { toast } from 'sonner';

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

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string | null;
  studyPdfUrl: string | null;
  homeworkPdfUrl: string | null;
  lessonNotes: string | null;
  grade: string;
  folderId: number;
  isFree?: boolean;
  coverImage?: string | null;
}

interface Folder {
  id: number;
  name: string;
  grade: string;
}

interface EditLessonDialogProps {
  lesson: Lesson;
  folders: Folder[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditLessonDialog({ lesson, folders, onClose, onSuccess }: EditLessonDialogProps) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || '');
  const [folderId, setFolderId] = useState(lesson.folderId.toString());
  const [grade, setGrade] = useState(lesson.grade);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || '');
  const [studyPdfUrl, setStudyPdfUrl] = useState(lesson.studyPdfUrl || '');
  const [homeworkPdfUrl, setHomeworkPdfUrl] = useState(lesson.homeworkPdfUrl || '');
  const [lessonNotes, setLessonNotes] = useState(lesson.lessonNotes || '');
  const [isFree, setIsFree] = useState(lesson.isFree || false);
  const [coverImage, setCoverImage] = useState(lesson.coverImage || '');
  const [coverImagePreview, setCoverImagePreview] = useState(lesson.coverImage || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImage(result);
        setCoverImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage('');
    setCoverImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/lessons?id=${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          folderId: parseInt(folderId),
          grade,
          videoUrl: videoUrl || null,
          studyPdfUrl: studyPdfUrl || null,
          homeworkPdfUrl: homeworkPdfUrl || null,
          lessonNotes: lessonNotes || null,
          isFree,
          coverImage: coverImage || null,
        }),
      });

      if (response.ok) {
        toast.success('تم تحديث الدرس بنجاح');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل تحديث الدرس');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث الدرس');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل الدرس</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>صورة الحصة (اختياري)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2"
                    onClick={removeCoverImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">اضغط لإضافة صورة للحصة</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">عنوان الدرس *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مقدمة في الجبر"
              required
              disabled={loading}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للدرس"
              disabled={loading}
              className="text-right min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folder">المجلد *</Label>
              <Select value={folderId} onValueChange={setFolderId} disabled={loading}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="اختر المجلد" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">الصف الدراسي *</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">رابط الفيديو</Label>
            <Input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studyPdfUrl">رابط PDF المذاكرة</Label>
            <Input
              id="studyPdfUrl"
              type="url"
              value={studyPdfUrl}
              onChange={(e) => setStudyPdfUrl(e.target.value)}
              placeholder="https://example.com/study.pdf"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeworkPdfUrl">رابط PDF الواجب</Label>
            <Input
              id="homeworkPdfUrl"
              type="url"
              value={homeworkPdfUrl}
              onChange={(e) => setHomeworkPdfUrl(e.target.value)}
              placeholder="https://example.com/homework.pdf"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonNotes">ملاحظات الدرس</Label>
            <Textarea
              id="lessonNotes"
              value={lessonNotes}
              onChange={(e) => setLessonNotes(e.target.value)}
              placeholder="ملاحظات مهمة للطلاب (ستظهر تحت الفيديو)"
              disabled={loading}
              className="text-right min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground text-right">
              هذه الملاحظات ستظهر للطلاب تحت الفيديو لمساعدتهم على فهم محتوى الدرس
            </p>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse p-4 border border-border rounded-lg bg-card/50">
            <Checkbox
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked as boolean)}
              disabled={loading}
            />
            <div className="flex-1">
              <Label
                htmlFor="isFree"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-green-500" />
                حصة مجانية
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                جعل هذه الحصة متاحة للجميع بدون اشتراك (الحصص المجانية تظهر في الأعلى)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !title || !folderId || !grade} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}