"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Video, FileText, BookOpen, Loader2, FolderOpen, Lock, Gift } from 'lucide-react';
import { LessonDetailModal } from './LessonDetailModal';
import { TeacherInfoBar } from './TeacherInfoBar';
import { SubscriptionDialog } from './SubscriptionDialog';
import { toast } from 'sonner';

interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  studyPdfUrl: string | null;
  homeworkPdfUrl: string | null;
  grade: string;
  isFree: boolean;
}

interface Folder {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
}

interface StudentFolderViewProps {
  folder: Folder;
  studentId?: number;
  onBack: () => void;
}

export function StudentFolderView({ folder, studentId, onBack }: StudentFolderViewProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  useEffect(() => {
    fetchLessons();
    checkSubscription();
  }, [folder.id]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/lessons?folderId=${folder.id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/subscriptions/check?studentId=${studentId}&folderId=${folder.id}`);
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.hasAccess);
        setSubscriptionData(data.subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isFree || hasSubscription) {
      setSelectedLesson(lesson);
    } else {
      toast.error('يجب الاشتراك للوصول إلى هذا الدرس');
      setShowSubscriptionDialog(true);
    }
  };

  const freeLessons = lessons.filter(l => l.isFree);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowRight className="w-5 h-5 ml-2" />
            رجوع
          </Button>
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{folder.name}</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Teacher Info Bar */}
        {studentId && (
          <TeacherInfoBar
            teacherId={folder.teacherId}
            folderId={folder.id}
            studentId={studentId}
            grade={folder.grade}
          />
        )}

        {/* Subscription Status */}
        {!hasSubscription && freeLessons.length > 0 && (
          <Card className="p-4 mb-6 bg-green-500/10 border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-500" />
                  {freeLessons.length} حصة مجانية متاحة! 🎉
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  اشترك للوصول إلى جميع الدروس
                </p>
              </div>
              <Button size="sm" onClick={() => setShowSubscriptionDialog(true)}>
                اشترك الآن
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد دروس</h3>
            <p className="text-muted-foreground">لم يتم إضافة دروس في هذا المجلد بعد</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const isLocked = !lesson.isFree && !hasSubscription;
              
              return (
                <Card
                  key={lesson.id}
                  className={`p-6 transition-all relative animate-scale-in card-hover ${
                    isLocked
                      ? 'opacity-75 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  {/* Free Badge */}
                  {lesson.isFree && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-medium shadow-lg animate-pulse-glow">
                      حصة مجانية
                    </div>
                  )}

                  {/* Lock Icon */}
                  {isLocked && (
                    <div className="absolute top-2 left-2 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-foreground mb-2 mt-6">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {lesson.description || 'لا يوجد وصف'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lesson.videoUrl && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        فيديو
                      </span>
                    )}
                    {lesson.studyPdfUrl && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        مذاكرة
                      </span>
                    )}
                    {lesson.homeworkPdfUrl && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        واجب
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          studentId={studentId}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      {/* Subscription Dialog */}
      {showSubscriptionDialog && studentId && (
        <SubscriptionDialog
          isOpen={showSubscriptionDialog}
          onClose={() => setShowSubscriptionDialog(false)}
          folderId={folder.id}
          folderName={folder.name}
          studentId={studentId}
          onSubscriptionSuccess={checkSubscription}
        />
      )}
    </div>
  );
}