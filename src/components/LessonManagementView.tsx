"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Loader2, Edit, ClipboardList, Sparkles, BookOpen, FileQuestion, MoreVertical, Image, ChevronDown, ChevronUp, MessageSquare, PenLine } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CreateFlashcardDialog } from './CreateFlashcardDialog';
import { CreateHomeworkQuestionDialog } from './CreateHomeworkQuestionDialog';
import { CreateExamDialog } from './CreateExamDialog';
import { EditLessonDialog } from './EditLessonDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Folder {
  id: number;
  name: string;
  grade: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  studyPdfUrl: string | null;
  homeworkPdfUrl: string | null;
  lessonNotes: string | null;
  grade: string;
  folderId: number;
  coverImage?: string | null;
}

interface LessonDetails {
  flashcardsCount: number;
  homeworkCount: number;
  examsCount: number;
  commentsCount: number;
  flashcards: any[];
  homeworkQuestions: any[];
  examQuestions: any[];
}

interface LessonManagementViewProps {
  folder: Folder;
  onBack: () => void;
  onRefresh: () => void;
}

export function LessonManagementView({ folder, onBack, onRefresh }: LessonManagementViewProps) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showCreateFlashcard, setShowCreateFlashcard] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showEditLesson, setShowEditLesson] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState<number | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [lessonDetails, setLessonDetails] = useState<Record<number, LessonDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<any | null>(null);
  const [editingHomework, setEditingHomework] = useState<any | null>(null);

  useEffect(() => {
    fetchLessons();
    fetchFolders();
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

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/lesson-folders?teacherId=${user?.id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchLessonDetails = async (lessonId: number) => {
    setLoadingDetails(lessonId);
    try {
      const [flashcardsRes, homeworkRes, examsRes, commentsRes] = await Promise.all([
        fetch(`/api/flashcards?lessonId=${lessonId}`),
        fetch(`/api/homework-questions?lessonId=${lessonId}`),
        fetch(`/api/exam-questions?lessonId=${lessonId}`),
        fetch(`/api/lesson-comments?lessonId=${lessonId}`)
      ]);

      const flashcards = flashcardsRes.ok ? await flashcardsRes.json() : [];
      const homeworkQuestions = homeworkRes.ok ? await homeworkRes.json() : [];
      const examQuestions = examsRes.ok ? await examsRes.json() : [];
      const comments = commentsRes.ok ? await commentsRes.json() : [];

      setLessonDetails(prev => ({
        ...prev,
        [lessonId]: {
          flashcardsCount: flashcards.length,
          homeworkCount: homeworkQuestions.length,
          examsCount: examQuestions.length,
          commentsCount: comments.length,
          flashcards,
          homeworkQuestions,
          examQuestions
        }
      }));
    } catch (error) {
      console.error('Error fetching lesson details:', error);
    } finally {
      setLoadingDetails(null);
    }
  };

  const toggleLessonExpand = (lessonId: number) => {
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
    } else {
      setExpandedLessonId(lessonId);
      if (!lessonDetails[lessonId]) {
        fetchLessonDetails(lessonId);
      }
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

    try {
      const response = await fetch(`/api/lessons?id=${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLessons();
      } else {
        toast.error('فشل حذف الدرس');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الدرس');
    }
  };

  const handleDeleteFlashcard = async (flashcardId: number, lessonId: number) => {
    try {
      const response = await fetch(`/api/flashcards?id=${flashcardId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('تم حذف البطاقة');
        fetchLessonDetails(lessonId);
      }
    } catch (error) {
      toast.error('فشل حذف البطاقة');
    }
  };

  const handleDeleteHomework = async (questionId: number, lessonId: number) => {
    try {
      const response = await fetch(`/api/homework-questions?id=${questionId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('تم حذف السؤال');
        fetchLessonDetails(lessonId);
      }
    } catch (error) {
      toast.error('فشل حذف السؤال');
    }
  };

  const generateAIFlashcards = async (lesson: Lesson) => {
    setAiGenerating(lesson.id);
    setOpenPopoverId(null);
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, action: 'flashcards' })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`تم إنشاء ${data.flashcards?.length || 0} بطاقة تعليمية بنجاح`);
        fetchLessonDetails(lesson.id);
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء البطاقات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء البطاقات');
    } finally {
      setAiGenerating(null);
    }
  };

  const generateAIHomework = async (lesson: Lesson) => {
    setAiGenerating(lesson.id);
    setOpenPopoverId(null);
    try {
      const response = await fetch('/api/ai-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`تم إنشاء ${data.questions?.length || 0} سؤال واجب بنجاح`);
        fetchLessonDetails(lesson.id);
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء أسئلة الواجب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء أسئلة الواجب');
    } finally {
      setAiGenerating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">لا توجد دروس في هذه المادة</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const details = lessonDetails[lesson.id];
              const isExpanded = expandedLessonId === lesson.id;

              return (
                <Card key={lesson.id} className="overflow-hidden">
                  {lesson.coverImage && (
                    <div className="h-32 relative">
                      <img src={lesson.coverImage} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedLesson(lesson); setShowEditLesson(true); }}>
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </Button>
                          
                          <Popover open={openPopoverId === lesson.id} onOpenChange={(open) => setOpenPopoverId(open ? lesson.id : null)}>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
                                <MoreVertical className="w-4 h-4 ml-2" />
                                أدوات
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-2" align="start">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground px-2 py-1 font-medium">إنشاء يدوي</p>
                                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => { setSelectedLesson(lesson); setShowCreateExam(true); setOpenPopoverId(null); }}>
                                  <ClipboardList className="w-4 h-4 ml-2 text-orange-500" />
                                  إنشاء امتحان
                                </Button>
                                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => { setSelectedLesson(lesson); setShowCreateFlashcard(true); setOpenPopoverId(null); }}>
                                  <BookOpen className="w-4 h-4 ml-2 text-blue-500" />
                                  إضافة بطاقة
                                </Button>
                                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => { setSelectedLesson(lesson); setShowCreateQuestion(true); setOpenPopoverId(null); }}>
                                  <FileQuestion className="w-4 h-4 ml-2 text-green-500" />
                                  إضافة سؤال واجب
                                </Button>
                                
                                <div className="border-t border-border my-2" />
                                <p className="text-xs text-muted-foreground px-2 py-1 font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  الذكاء الاصطناعي
                                </p>
                                <Button size="sm" variant="ghost" className="w-full justify-start bg-gradient-to-r from-purple-500/5 to-blue-500/5" onClick={() => generateAIFlashcards(lesson)} disabled={aiGenerating === lesson.id}>
                                  {aiGenerating === lesson.id ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2 text-purple-500" />}
                                  بطاقات AI
                                </Button>
                                <Button size="sm" variant="ghost" className="w-full justify-start bg-gradient-to-r from-purple-500/5 to-blue-500/5" onClick={() => generateAIHomework(lesson)} disabled={aiGenerating === lesson.id}>
                                  {aiGenerating === lesson.id ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2 text-purple-500" />}
                                  أسئلة واجب AI
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Button size="sm" variant="ghost" onClick={() => toggleLessonExpand(lesson.id)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                          </Button>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-border">
                        {loadingDetails === lesson.id ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : details ? (
                          <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                                <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-blue-500">{details.flashcardsCount}</p>
                                <p className="text-xs text-muted-foreground">بطاقة</p>
                              </div>
                              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                                <FileQuestion className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-green-500">{details.homeworkCount}</p>
                                <p className="text-xs text-muted-foreground">واجب</p>
                              </div>
                              <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                                <ClipboardList className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-orange-500">{details.examsCount}</p>
                                <p className="text-xs text-muted-foreground">امتحان</p>
                              </div>
                              <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                                <MessageSquare className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                <p className="text-lg font-bold text-purple-500">{details.commentsCount}</p>
                                <p className="text-xs text-muted-foreground">تعليق</p>
                              </div>
                            </div>

                            {/* Flashcards */}
                            {details.flashcards.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-sm flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                    البطاقات التعليمية
                                  </h4>
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedLesson(lesson); setShowCreateFlashcard(true); }}>
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة
                                  </Button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {details.flashcards.map((card: any) => (
                                    <div key={card.id} className="p-3 bg-secondary/30 rounded-lg flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{card.question}</p>
                                        <p className="text-xs text-muted-foreground truncate">{card.answer}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteFlashcard(card.id, lesson.id)}>
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Homework */}
                            {details.homeworkQuestions.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-sm flex items-center gap-2">
                                    <FileQuestion className="w-4 h-4 text-green-500" />
                                    أسئلة الواجب
                                  </h4>
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedLesson(lesson); setShowCreateQuestion(true); }}>
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة
                                  </Button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {details.homeworkQuestions.map((q: any) => (
                                    <div key={q.id} className="p-3 bg-secondary/30 rounded-lg flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{q.questionText}</p>
                                        <p className="text-xs text-green-500">الإجابة: {q.correctAnswer}</p>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteHomework(q.id, lesson.id)}>
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exams */}
                            {details.examQuestions.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-sm flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-orange-500" />
                                    أسئلة الامتحان
                                  </h4>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {details.examQuestions.map((q: any) => (
                                    <div key={q.id} className="p-3 bg-secondary/30 rounded-lg">
                                      <p className="text-sm font-medium">{q.questionText}</p>
                                      <p className="text-xs text-orange-500 mt-1">الإجابة: {q.correctAnswer}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {details.flashcardsCount === 0 && details.homeworkCount === 0 && details.examsCount === 0 && (
                              <p className="text-center text-muted-foreground py-4">لا توجد محتويات بعد. استخدم أدوات الدرس لإضافة محتوى.</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Dialogs */}
      {showEditLesson && selectedLesson && (
        <EditLessonDialog
          lesson={selectedLesson}
          folders={folders}
          onClose={() => { setShowEditLesson(false); setSelectedLesson(null); }}
          onSuccess={() => { setShowEditLesson(false); setSelectedLesson(null); fetchLessons(); onRefresh(); }}
        />
      )}

      {showCreateExam && selectedLesson && (
        <CreateExamDialog
          isOpen={showCreateExam}
          onClose={() => { setShowCreateExam(false); setSelectedLesson(null); }}
          lessonId={selectedLesson.id}
          onSuccess={() => { setShowCreateExam(false); setSelectedLesson(null); if (expandedLessonId) fetchLessonDetails(expandedLessonId); }}
        />
      )}

      {showCreateFlashcard && selectedLesson && user && (
        <CreateFlashcardDialog
          lessonId={selectedLesson.id}
          teacherId={user.id}
          onClose={() => { setShowCreateFlashcard(false); setSelectedLesson(null); }}
          onSuccess={() => { setShowCreateFlashcard(false); setSelectedLesson(null); if (expandedLessonId) fetchLessonDetails(expandedLessonId); }}
        />
      )}

      {showCreateQuestion && selectedLesson && (
        <CreateHomeworkQuestionDialog
          lessonId={selectedLesson.id}
          onClose={() => { setShowCreateQuestion(false); setSelectedLesson(null); }}
          onSuccess={() => { setShowCreateQuestion(false); setSelectedLesson(null); if (expandedLessonId) fetchLessonDetails(expandedLessonId); }}
        />
      )}
    </div>
  );
}