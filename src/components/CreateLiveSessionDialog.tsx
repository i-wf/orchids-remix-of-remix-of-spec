"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Video, Gift, Link } from 'lucide-react';
import { toast } from 'sonner';

interface Folder {
  id: number;
  name: string;
  grade: string;
}

interface CreateLiveSessionDialogProps {
  teacherId: number;
  folders: Folder[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLiveSessionDialog({ teacherId, folders, onClose, onSuccess }: CreateLiveSessionDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          folderId: parseInt(folderId),
          title,
          description: description || null,
          zoomLink,
          isFree,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('تم إنشاء اللايف بنجاح');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء اللايف');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء اللايف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            إنشاء لايف جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان اللايف *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة الفصل الأول"
              required
              disabled={loading}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف اللايف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للايف"
              disabled={loading}
              className="text-right min-h-[80px]"
            />
          </div>

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
            <Label htmlFor="zoomLink" className="flex items-center gap-2">
              <Link className="w-4 h-4 text-blue-500" />
              لينك الزوم *
            </Label>
            <Input
              id="zoomLink"
              type="url"
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              required
              disabled={loading}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">موعد اللايف *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              disabled={loading}
            />
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
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-green-500" />
                لايف مجاني
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                جعل هذا اللايف متاح للجميع بدون اشتراك
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !title || !folderId || !zoomLink || !scheduledAt} className="flex-1 bg-red-500 hover:bg-red-600">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 ml-2" />
                  إنشاء اللايف
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
