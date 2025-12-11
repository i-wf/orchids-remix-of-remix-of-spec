"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Lesson {
  id: number;
  title: string;
  description: string;
  grade: string;
}

interface Summary {
  id: number;
  lessonId: number;
  summaryText: string;
  createdAt: string;
}

interface SummariesListViewProps {
  studentId: number;
  grade: string;
}

export function SummariesListView({ studentId, grade }: SummariesListViewProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<{ lesson: Lesson; summary: Summary } | null>(null);

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

        // Fetch summaries for these lessons
        const summariesPromises = lessonsData.map((lesson: Lesson) =>
          fetch(`/api/ai-summaries?lessonId=${lesson.id}`).then(res => res.ok ? res.json() : null)
        );
        const summariesData = await Promise.all(summariesPromises);
        const validSummaries = summariesData.filter(s => s && s.summaryText);
        setSummaries(validSummaries);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonForSummary = (summary: Summary) => {
    return lessons.find(l => l.id === summary.lessonId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد ملخصات</h3>
        <p className="text-muted-foreground">لم يتم إنشاء ملخصات بواسطة AI بعد</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">الملخصات الذكية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((summary) => {
          const lesson = getLessonForSummary(summary);
          if (!lesson) return null;

          return (
            <Card
              key={summary.id}
              className="p-6 hover:border-primary cursor-pointer transition-colors"
              onClick={() => setSelectedSummary({ lesson, summary })}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground mb-2">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {summary.summaryText}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 ml-2" />
                    عرض الملخص
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Detail Modal */}
      {selectedSummary && (
        <Dialog open={true} onOpenChange={() => setSelectedSummary(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-right flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {selectedSummary.lesson.title}
              </DialogTitle>
            </DialogHeader>
            <Card className="p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">ملخص الدرس</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-right">
                  {selectedSummary.summary.summaryText}
                </p>
              </div>
            </Card>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
