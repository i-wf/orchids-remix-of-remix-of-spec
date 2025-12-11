"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Gift } from 'lucide-react';
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

interface Folder {
  id: number;
  name: string;
  grade: string;
}

interface CreateLessonDialogProps {
  teacherId: number;
  folders: Folder[];
  onClose: () => void;
  onSuccess: () => void;
}

const DRAFT_KEY = 'lesson_draft';

export function CreateLessonDialog({ teacherId, folders, onClose, onSuccess }: CreateLessonDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [grade, setGrade] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [studyPdfUrl, setStudyPdfUrl] = useState('');
  const [homeworkPdfUrl, setHomeworkPdfUrl] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || '');
        setDescription(parsed.description || '');
        setFolderId(parsed.folderId || '');
        setGrade(parsed.grade || '');
        setVideoUrl(parsed.videoUrl || '');
        setStudyPdfUrl(parsed.studyPdfUrl || '');
        setHomeworkPdfUrl(parsed.homeworkPdfUrl || '');
        setIsFree(parsed.isFree || false);
        toast.success('تم استرجاع المسودة المحفوظة');
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || description || videoUrl || studyPdfUrl || homeworkPdfUrl) {
        const draft = {
          title,
          description,
          folderId,
          grade,
          videoUrl,
          studyPdfUrl,
          homeworkPdfUrl,
          isFree,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, description, folderId, grade, videoUrl, studyPdfUrl, homeworkPdfUrl, isFree]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          folderId: parseInt(folderId),
          teacherId,
          grade,
          videoUrl: videoUrl || null,
          studyPdfUrl: studyPdfUrl || null,
          homeworkPdfUrl: homeworkPdfUrl || null,
          isFree,
        }),
      });

      if (response.ok) {
        localStorage.removeItem(DRAFT_KEY);
        toast.success('تم إنشاء الدرس بنجاح');
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.error || 'فشل إنشاء الدرس');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الدرس');
    } finally {
      setLoading(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setDescription('');
    setFolderId('');
    setGrade('');
    setVideoUrl('');
    setStudyPdfUrl('');
    setHomeworkPdfUrl('');
    setIsFree(false);
    toast.success('تم مسح المسودة');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center justify-between">
            <span>إنشاء درس جديد</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="w-3 h-3" />
                حُفظ تلقائياً {lastSaved.toLocaleTimeString('ar-EG')}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folder">المادة *</Label>
              <Select value={folderId} onValueChange={setFolderId} disabled={loading}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="اختر المادة" />
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

          {/* Free Lesson Checkbox */}
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

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              إلغاء
            </Button>
            <Button type="button" variant="secondary" onClick={clearDraft} disabled={loading}>
              مسح المسودة
            </Button>
            <Button type="submit" disabled={loading || !title || !folderId || !grade} className="flex-1">
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