"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

interface CreateExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  onSuccess: () => void;
}

export function CreateExamDialog({ isOpen, onClose, lessonId, onSuccess }: CreateExamDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = () => {
    if (questions.length >= 40) {
      toast.error('الحد الأقصى هو 40 سؤال');
      return;
    }
    setQuestions([
      ...questions,
      { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('يجب أن يحتوي الامتحان على سؤال واحد على الأقل');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان الامتحان');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`يرجى إدخال السؤال رقم ${i + 1}`);
        return false;
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`يرجى إدخال جميع الخيارات للسؤال رقم ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create exam
      const examResponse = await fetch('/api/exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          title,
          description: description.trim() || null,
          totalQuestions: questions.length,
        }),
      });

      if (!examResponse.ok) {
        throw new Error('Failed to create exam');
      }

      const examData = await examResponse.json();
      const examId = examData.id;

      // Create questions
      for (const question of questions) {
        await fetch('/api/exam-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId,
            ...question,
          }),
        });
      }

      toast.success('تم إنشاء الامتحان بنجاح!');
      onSuccess();
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setQuestions([
        { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
      ]);
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الامتحان');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            إنشاء امتحان جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exam Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الامتحان *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: امتحان الفصل الأول"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف الامتحان (اختياري)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للامتحان..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">الأسئلة ({questions.length}/40)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddQuestion}
                disabled={loading || questions.length >= 40}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة سؤال
              </Button>
            </div>

            {questions.map((question, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">السؤال {index + 1}</Label>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <Textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  placeholder="اكتب السؤال هنا..."
                  disabled={loading}
                  className="min-h-[80px]"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">الخيار A</Label>
                    <Input
                      value={question.optionA}
                      onChange={(e) => handleQuestionChange(index, 'optionA', e.target.value)}
                      placeholder="الخيار الأول"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">الخيار B</Label>
                    <Input
                      value={question.optionB}
                      onChange={(e) => handleQuestionChange(index, 'optionB', e.target.value)}
                      placeholder="الخيار الثاني"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">الخيار C</Label>
                    <Input
                      value={question.optionC}
                      onChange={(e) => handleQuestionChange(index, 'optionC', e.target.value)}
                      placeholder="الخيار الثالث"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">الخيار D</Label>
                    <Input
                      value={question.optionD}
                      onChange={(e) => handleQuestionChange(index, 'optionD', e.target.value)}
                      placeholder="الخيار الرابع"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">الإجابة الصحيحة</Label>
                  <div className="flex gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleQuestionChange(index, 'correctAnswer', option)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          question.correctAnswer === option
                            ? 'border-green-500 bg-green-500/10 text-green-500 font-bold'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                'إنشاء الامتحان'
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
