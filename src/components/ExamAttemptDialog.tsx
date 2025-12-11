"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ClipboardList, Award, X, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

interface Exam {
  id: number;
  title: string;
  description: string | null;
  totalQuestions: number;
}

interface ExamAttemptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  studentId: number;
  onAttemptComplete: () => void;
}

export function ExamAttemptDialog({
  isOpen,
  onClose,
  examId,
  studentId,
  onAttemptComplete,
}: ExamAttemptDialogProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchExam();
    }
  }, [isOpen, examId]);

  const fetchExam = async () => {
    try {
      // Fetch exam details
      const examResponse = await fetch(`/api/exam-questions?examId=${examId}&limit=1`);
      if (examResponse.ok) {
        const examData = await examResponse.json();
        if (examData.length > 0) {
          setExam(examData[0]);
        }
      }

      // Fetch questions
      const questionsResponse = await fetch(`/api/exam-questions?examId=${examId}&limit=100`);
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      toast.error('حدث خطأ أثناء تحميل الامتحان');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `لم تجب على ${unanswered.length} سؤال. هل تريد تسليم الامتحان؟`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const finalScore = calculateScore();
      setScore(finalScore);

      // Submit attempt
      const response = await fetch('/api/exam-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          studentId,
          score: finalScore,
          totalQuestions: questions.length,
          answers: JSON.stringify(answers),
        }),
      });

      if (response.ok) {
        toast.success('تم تسليم الامتحان بنجاح!');
        setShowResults(true);
        onAttemptComplete();
      } else {
        toast.error('فشل تسليم الامتحان');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسليم الامتحان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!showResults && Object.keys(answers).length > 0) {
      const confirm = window.confirm('هل أنت متأكد من الخروج؟ لن يتم حفظ إجاباتك.');
      if (!confirm) return;
    }
    
    // Reset state
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
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

  if (!exam || questions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">خطأ</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على الامتحان</p>
            <Button onClick={handleClose}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Results View
  if (showResults) {
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 50;

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">نتيجة الامتحان</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="text-center">
              <div
                className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  passed ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                {passed ? (
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>

              <h3 className="text-3xl font-bold text-foreground mb-2">
                {percentage.toFixed(0)}%
              </h3>
              <p className="text-lg text-muted-foreground mb-4">
                {score} من {questions.length} إجابة صحيحة
              </p>

              <div className={`inline-block px-4 py-2 rounded-full ${
                passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                <p className="font-bold">
                  {passed ? '✓ نجحت في الامتحان' : '✗ لم تنجح في الامتحان'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={percentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                الحد الأدنى للنجاح: 50%
              </p>
            </div>

            <Button onClick={handleClose} className="w-full" size="lg">
              إنهاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Exam View
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {exam.title}
          </DialogTitle>
          {exam.description && (
            <p className="text-sm text-muted-foreground">{exam.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </span>
              <span className="text-muted-foreground">
                تم الإجابة: {answeredCount}/{questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = currentQuestion[`option${option}` as keyof Question] as string;
                  const isSelected = answers[currentQuestion.id] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      disabled={submitting}
                      className={`w-full p-4 rounded-lg border-2 text-right transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-border'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">
                            {option}. {optionText}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || submitting}
              variant="outline"
            >
              السابق
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  disabled={submitting}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : answers[questions[index].id]
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جارٍ التسليم...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 ml-2" />
                    تسليم الامتحان
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1 || submitting}
              >
                التالي
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
