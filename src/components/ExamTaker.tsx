"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionOrder: number;
}

interface ExamTakerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  lessonTitle: string;
  studentId: number;
}

export function ExamTaker({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  studentId,
}: ExamTakerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, lessonId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/exam-questions?lessonId=${lessonId}&includeAnswers=false`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('فشل تحميل الأسئلة');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Check all questions answered
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`يرجى الإجابة على جميع الأسئلة (متبقي ${unanswered.length})`);
      return;
    }

    setSubmitting(true);

    try {
      // Get correct answers
      const correctAnswersResponse = await fetch(`/api/exam-questions?lessonId=${lessonId}&includeAnswers=true`);
      const questionsWithAnswers = await correctAnswersResponse.json();

      // Calculate score
      let score = 0;
      const detailedAnswers: any[] = [];

      questions.forEach(q => {
        const correctQ = questionsWithAnswers.find((cq: any) => cq.id === q.id);
        const isCorrect = answers[q.id] === correctQ.correctAnswer;
        if (isCorrect) score++;

        detailedAnswers.push({
          questionId: q.id,
          questionText: q.questionText,
          userAnswer: answers[q.id],
          correctAnswer: correctQ.correctAnswer,
          isCorrect,
          explanation: correctQ.explanation,
        });
      });

      // Save attempt
      const attemptResponse = await fetch('/api/exam-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lessonId,
          score,
          totalQuestions: questions.length,
          answersJson: JSON.stringify(detailedAnswers),
        }),
      });

      if (!attemptResponse.ok) {
        throw new Error('Failed to save exam attempt');
      }

      setResults({
        score,
        totalQuestions: questions.length,
        percentage: (score / questions.length) * 100,
        detailedAnswers,
      });
      setShowResults(true);

      toast.success('تم إرسال الامتحان بنجاح!');
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال الامتحان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnswers({});
    setShowResults(false);
    setResults(null);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (questions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">لا توجد أسئلة</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground py-8">
            لم يتم إنشاء امتحان لهذا الدرس بعد
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResults && results) {
    const passed = results.percentage >= 60;

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-xl">نتيجة الامتحان</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Card */}
            <div className={`p-6 rounded-lg text-center ${passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}">
                {passed ? (
                  <Award className="w-10 h-10 text-green-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {results.score} / {results.totalQuestions}
              </h3>
              <p className="text-lg text-muted-foreground mb-4">
                النسبة: {results.percentage.toFixed(1)}%
              </p>
              <p className={`font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {passed ? '✓ ناجح' : '✗ راسب'} (الحد الأدنى: 60%)
              </p>
            </div>

            {/* Detailed Answers */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">الإجابات التفصيلية:</h4>
              {results.detailedAnswers.map((answer: any, index: number) => (
                <div
                  key={answer.questionId}
                  className={`p-4 rounded-lg border-2 ${
                    answer.isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {answer.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-2">
                        {index + 1}. {answer.questionText}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">إجابتك:</span>{' '}
                          <span className={answer.isCorrect ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                            {answer.userAnswer.toUpperCase()}
                          </span>
                        </p>
                        {!answer.isCorrect && (
                          <p>
                            <span className="text-muted-foreground">الإجابة الصحيحة:</span>{' '}
                            <span className="text-green-500 font-medium">{answer.correctAnswer.toUpperCase()}</span>
                          </p>
                        )}
                        {answer.explanation && (
                          <p className="text-muted-foreground mt-2">
                            <strong>الشرح:</strong> {answer.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleClose} className="w-full">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Exam taking view
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">امتحان: {lessonTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                تم الإجابة: {answeredCount} / {questions.length}
              </span>
              <span className="text-sm font-bold text-primary">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Questions */}
          {questions.map((question, index) => (
            <div key={question.id} className="p-4 border border-border rounded-lg space-y-3">
              <p className="font-medium text-foreground">
                {index + 1}. {question.questionText}
              </p>

              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
              >
                <div className="space-y-2">
                  {['a', 'b', 'c', 'd'].map((option) => (
                    <div
                      key={option}
                      className={`flex items-center space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer transition-colors ${
                        answers[question.id] === option ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setAnswers({ ...answers, [question.id]: option })}
                    >
                      <RadioGroupItem value={option} id={`q${question.id}-${option}`} />
                      <Label
                        htmlFor={`q${question.id}-${option}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option === 'a' && question.optionA}
                        {option === 'b' && question.optionB}
                        {option === 'c' && question.optionC}
                        {option === 'd' && question.optionD}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              `إرسال الامتحان (${answeredCount}/${questions.length})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
