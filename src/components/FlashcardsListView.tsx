"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Library, BookOpen, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlashcardViewer } from './FlashcardViewer';

interface Lesson {
  id: number;
  title: string;
  description: string;
  grade: string;
}

interface Flashcard {
  id: number;
  lessonId: number;
  question: string;
  answer: string;
  explanation: string | null;
  type: 'manual' | 'ai';
}

interface FlashcardsListViewProps {
  studentId: number;
  grade: string;
}

export function FlashcardsListView({ studentId, grade }: FlashcardsListViewProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [flashcardCounts, setFlashcardCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId, grade]);

  const fetchData = async () => {
    try {
      // Fetch lessons for grade
      const lessonsResponse = await fetch(`/api/lessons?grade=${grade}&limit=100`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);

        // Fetch flashcard counts for these lessons
        const countsPromises = lessonsData.map(async (lesson: Lesson) => {
          const response = await fetch(`/api/flashcards?lessonId=${lesson.id}&limit=100`);
          if (response.ok) {
            const flashcards = await response.json();
            return { lessonId: lesson.id, count: flashcards.length };
          }
          return { lessonId: lesson.id, count: 0 };
        });
        const countsData = await Promise.all(countsPromises);
        const countsMap = countsData.reduce((acc, { lessonId, count }) => {
          acc[lessonId] = count;
          return acc;
        }, {} as Record<number, number>);
        setFlashcardCounts(countsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lessonsWithFlashcards = lessons.filter(lesson => (flashcardCounts[lesson.id] || 0) > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (lessonsWithFlashcards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد بطاقات تعليمية</h3>
        <p className="text-muted-foreground">لم يتم إنشاء بطاقات تعليمية بعد</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">البطاقات التعليمية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessonsWithFlashcards.map((lesson) => (
          <Card
            key={lesson.id}
            className="p-6 hover:border-primary cursor-pointer transition-colors"
            onClick={() => setSelectedLesson(lesson)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground mb-2">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {flashcardCounts[lesson.id]} بطاقة متاحة
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Play className="w-4 h-4 ml-2" />
                  ابدأ المراجعة
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Flashcards Viewer Modal */}
      {selectedLesson && (
        <Dialog open={true} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-right flex items-center gap-2">
                <Library className="w-6 h-6 text-primary" />
                {selectedLesson.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4">
              <FlashcardViewer lessonId={selectedLesson.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
