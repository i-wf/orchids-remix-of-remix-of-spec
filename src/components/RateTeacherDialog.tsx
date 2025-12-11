"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RateTeacherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: number;
  folderId: number;
  studentId: number;
  teacherName: string;
  onRatingSuccess: () => void;
}

export function RateTeacherDialog({
  isOpen,
  onClose,
  teacherId,
  folderId,
  studentId,
  teacherName,
  onRatingSuccess,
}: RateTeacherDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('يرجى اختيار التقييم');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          folderId,
          studentId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('تم إرسال التقييم بنجاح!');
        onRatingSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إرسال التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>قيّم المعلم {teacherName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">اختر التقييم</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={loading}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium text-foreground">
                {rating === 1 && 'سيء جداً'}
                {rating === 2 && 'سيء'}
                {rating === 3 && 'متوسط'}
                {rating === 4 && 'جيد'}
                {rating === 5 && 'ممتاز'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              تعليق (اختياري)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك رأيك حول المعلم..."
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإرسال...
                </>
              ) : (
                'إرسال التقييم'
              )}
            </Button>
            <Button onClick={onClose} variant="outline" disabled={loading}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
