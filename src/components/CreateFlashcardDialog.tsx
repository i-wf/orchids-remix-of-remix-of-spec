"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreateFlashcardDialogProps {
  lessonId: number;
  teacherId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFlashcardDialog({ lessonId, teacherId, onClose, onSuccess }: CreateFlashcardDialogProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          question,
          answer,
          explanation: explanation || null,
          type: 'manual',
          createdByTeacherId: teacherId,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.error || 'فشل إنشاء البطاقة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء البطاقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء بطاقة تعليمية</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">السؤال *</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="ما هو...؟"
              required
              disabled={loading}
              className="text-right min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">الإجابة *</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="الإجابة..."
              required
              disabled={loading}
              className="text-right min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">الشرح (اختياري)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="شرح إضافي..."
              disabled={loading}
              className="text-right min-h-[80px]"
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
            <Button type="submit" disabled={loading || !question || !answer} className="flex-1">
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
