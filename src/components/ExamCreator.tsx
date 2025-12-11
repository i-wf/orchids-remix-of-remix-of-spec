"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

interface ExamCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  lessonTitle: string;
  onSuccess: () => void;
}

export function ExamCreator({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  onSuccess,
}: ExamCreatorProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'a',
      explanation: '',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    if (questions.length >= 40) {
      toast.error('الحد الأقصى للأسئلة هو 40 سؤال');
      return;
    }
    setQuestions([
      ...questions,
      {
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'a',
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`السؤال ${i + 1}: نص السؤال مطلوب`);
        return false;
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`السؤال ${i + 1}: جميع الخيارات مطلوبة`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) return;

    setLoading(true);

    try {
      // Create all questions
      const promises = questions.map((q, index) =>
        fetch('/api/exam-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            questionOrder: index + 1,
          }),
        })
      );

      await Promise.all(promises);

      toast.success(`تم إنشاء ${questions.length} سؤال بنجاح!`);
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الأسئلة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">
            إنشاء امتحان: {lessonTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              عدد الأسئلة: {questions.length} / 40
            </p>
            <Button onClick={addQuestion} size="sm" variant="outline" disabled={questions.length >= 40}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة سؤال
            </Button>
          </div>

          {questions.map((question, index) => (
            <div key={index} className="p-4 border border-border rounded-lg space-y-4 relative">
              {/* Delete Button */}
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-foreground">السؤال {index + 1}</span>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label>نص السؤال *</Label>
                <Textarea
                  value={question.questionText}
                  onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                  placeholder="اكتب السؤال هنا..."
                  className="resize-none text-right"
                  rows={2}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الخيار أ *</Label>
                  <Input
                    value={question.optionA}
                    onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                    placeholder="الخيار أ"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخيار ب *</Label>
                  <Input
                    value={question.optionB}
                    onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                    placeholder="الخيار ب"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخيار ج *</Label>
                  <Input
                    value={question.optionC}
                    onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                    placeholder="الخيار ج"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخيار د *</Label>
                  <Input
                    value={question.optionD}
                    onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                    placeholder="الخيار د"
                    className="text-right"
                  />
                </div>
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <Label>الإجابة الصحيحة *</Label>
                <RadioGroup
                  value={question.correctAnswer}
                  onValueChange={(v) => updateQuestion(index, 'correctAnswer', v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="a" id={`q${index}-a`} />
                    <Label htmlFor={`q${index}-a`} className="cursor-pointer">أ</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="b" id={`q${index}-b`} />
                    <Label htmlFor={`q${index}-b`} className="cursor-pointer">ب</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="c" id={`q${index}-c`} />
                    <Label htmlFor={`q${index}-c`} className="cursor-pointer">ج</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="d" id={`q${index}-d`} />
                    <Label htmlFor={`q${index}-d`} className="cursor-pointer">د</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <Label>الشرح (اختياري)</Label>
                <Textarea
                  value={question.explanation}
                  onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                  placeholder="اشرح لماذا هذه الإجابة صحيحة..."
                  className="resize-none text-right"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الامتحان ({questions.length} سؤال)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
