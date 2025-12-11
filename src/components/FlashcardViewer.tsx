"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCw, Loader2, BookOpen, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  explanation: string | null;
  type: 'manual' | 'ai';
}

interface FlashcardViewerProps {
  lessonId: number;
}

export function FlashcardViewer({ lessonId }: FlashcardViewerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    fetchFlashcards();
  }, [lessonId]);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`/api/flashcards?lessonId=${lessonId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setFlashcards(data);
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setFeedback(null);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
    setFeedback(null);
  };

  const handleFeedback = (type: 'correct' | 'incorrect') => {
    setFeedback(type);
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        handleNext();
      } else {
        setFeedback(null);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">جارٍ تحميل البطاقات...</p>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد بطاقات</h3>
        <p className="text-muted-foreground">لم يتم إنشاء بطاقات لهذا الدرس بعد</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="text-center text-sm text-muted-foreground">
        البطاقة {currentIndex + 1} من {flashcards.length}
      </div>

      {/* Flashcard */}
      <Card
        className={`relative min-h-[400px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          feedback === 'correct'
            ? 'border-green-500 bg-green-500/10'
            : feedback === 'incorrect'
            ? 'border-red-500 bg-red-500/10'
            : ''
        }`}
        onClick={handleFlip}
      >
        {currentCard.type === 'ai' && (
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">AI</span>
          </div>
        )}

        <div className="text-center max-w-2xl">
          {!showAnswer ? (
            <>
              <h3 className="text-2xl font-bold text-foreground mb-4">السؤال</h3>
              <p className="text-lg text-foreground leading-relaxed">{currentCard.question}</p>
              <p className="text-sm text-muted-foreground mt-6">اضغط لإظهار الإجابة</p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-foreground mb-4">الإجابة</h3>
              <p className="text-lg text-foreground leading-relaxed mb-6">{currentCard.answer}</p>
              
              {currentCard.explanation && (
                <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">الشرح</h4>
                  </div>
                  <p className="text-sm text-muted-foreground text-right">{currentCard.explanation}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Feedback Buttons (shown when answer is visible) */}
      {showAnswer && !feedback && (
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => handleFeedback('incorrect')}
            variant="outline"
            className="flex-1 max-w-xs border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <ThumbsDown className="w-4 h-4 ml-2" />
            لم أعرف الإجابة
          </Button>
          <Button
            onClick={() => handleFeedback('correct')}
            variant="outline"
            className="flex-1 max-w-xs border-green-500 text-green-500 hover:bg-green-500/10"
          >
            <ThumbsUp className="w-4 h-4 ml-2" />
            عرفت الإجابة
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>

        <Button onClick={handleFlip} variant="outline">
          <RotateCw className="w-4 h-4 ml-2" />
          {showAnswer ? 'إخفاء الإجابة' : 'إظهار الإجابة'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          variant="outline"
        >
          التالي
          <ChevronLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
}
