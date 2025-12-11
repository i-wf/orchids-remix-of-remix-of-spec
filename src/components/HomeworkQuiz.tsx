"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Award } from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string;
  explanation?: string;
}

interface HomeworkQuizProps {
  lessonId: number;
  studentId?: number;
}

export function HomeworkQuiz({ lessonId, studentId }: HomeworkQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/homework-questions?lessonId=${lessonId}&includeAnswers=false`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Fetch questions with answers
    const response = await fetch(`/api/homework-questions?lessonId=${lessonId}`);
    if (response.ok) {
      const questionsWithAnswers = await response.json();
      
      let correctCount = 0;
      questionsWithAnswers.forEach((q: Question) => {
        if (answers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });

      setScore(correctCount);
      setQuestions(questionsWithAnswers);
      setSubmitted(true);

      // Update student progress
      if (studentId) {
        const progressResponse = await fetch(`/api/student-progress?studentId=${studentId}&lessonId=${lessonId}`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.length > 0) {
            await fetch(`/api/student-progress?id=${progressData[0].id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                homeworkCompleted: true,
                homeworkScore: Math.round((correctCount / questionsWithAnswers.length) * 100),
              }),
            });
          } else {
            await fetch('/api/student-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                lessonId,
                homeworkCompleted: true,
                homeworkScore: Math.round((correctCount / questionsWithAnswers.length) * 100),
              }),
            });
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">جارٍ تحميل الأسئلة...</p>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">لا توجد أسئلة لهذا الواجب</p>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="p-8">
        <div className="text-center mb-6">
          <Award className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-2">تم إرسال الواجب!</h3>
          <p className="text-lg text-muted-foreground">
            نتيجتك: {score} من {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = answers[question.id];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div key={question.id} className="p-4 bg-secondary rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-2">
                      {index + 1}. {question.questionText}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        إجابتك: <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>{userAnswer?.toUpperCase()}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-green-500">الإجابة الصحيحة: {question.correctAnswer?.toUpperCase()}</p>
                      )}
                      {question.explanation && (
                        <p className="text-muted-foreground mt-2 pt-2 border-t border-border">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">أسئلة الواجب</h3>
      
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <p className="font-semibold text-foreground">
              {index + 1}. {question.questionText}
            </p>
            
            <div className="space-y-2">
              {['a', 'b', 'c', 'd'].map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[question.id] === option
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-foreground">
                    {option.toUpperCase()}. {question[`option${option.toUpperCase()}` as keyof Question]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length !== questions.length}
        className="w-full mt-6"
      >
        إرسال الواجب
      </Button>
    </Card>
  );
}
