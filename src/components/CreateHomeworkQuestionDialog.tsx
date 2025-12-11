"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateHomeworkQuestionDialogProps {
  lessonId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateHomeworkQuestionDialog({ lessonId, onClose, onSuccess }: CreateHomeworkQuestionDialogProps) {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/homework-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          explanation: explanation || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        setError(error.error || 'فشل إنشاء السؤال');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء السؤال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء سؤال اختيار من متعدد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">السؤال *</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="نص السؤال..."
              required
              disabled={loading}
              className="text-right min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="optionA">الخيار A *</Label>
              <Input
                id="optionA"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="الخيار الأول"
                required
                disabled={loading}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionB">الخيار B *</Label>
              <Input
                id="optionB"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="الخيار الثاني"
                required
                disabled={loading}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionC">الخيار C *</Label>
              <Input
                id="optionC"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="الخيار الثالث"
                required
                disabled={loading}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionD">الخيار D *</Label>
              <Input
                id="optionD"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="الخيار الرابع"
                required
                disabled={loading}
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correctAnswer">الإجابة الصحيحة *</Label>
            <Select value={correctAnswer} onValueChange={setCorrectAnswer} disabled={loading}>
              <SelectTrigger id="correctAnswer">
                <SelectValue placeholder="اختر الإجابة الصحيحة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">A</SelectItem>
                <SelectItem value="b">B</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="d">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">الشرح (اختياري)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="شرح الإجابة الصحيحة..."
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
            <Button
              type="submit"
              disabled={loading || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer}
              className="flex-1"
            >
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
