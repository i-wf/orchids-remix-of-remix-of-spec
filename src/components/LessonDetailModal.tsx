"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Video, FileText, ClipboardList, Sparkles, BookOpen, Loader2, Calendar, Copy, CheckCircle, FileCheck2, AlertCircle, Star, MessageSquare, Send, PenLine } from 'lucide-react';
import { FlashcardViewer } from './FlashcardViewer';
import { HomeworkQuiz } from './HomeworkQuiz';
import { toast } from 'sonner';

interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  studyPdfUrl: string | null;
  homeworkPdfUrl: string | null;
  lessonNotes: string | null;
  grade: string;
  createdAt?: string;
  coverImage?: string | null;
}

interface Comment {
  id: number;
  lessonId: number;
  studentId: number;
  commentText: string;
  createdAt: string;
  studentName: string | null;
}

interface LessonDetailModalProps {
  lesson: Lesson;
  studentId?: number;
  onClose: () => void;
  isTeacher?: boolean;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = null;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) videoId = shortMatch[1];
  
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) videoId = embedMatch[1];
  
  if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function formatTimeSince(dateString: string): string {
  const now = new Date();
  const createdDate = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'منذ يوم واحد';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  return `منذ ${diffDays} يوم`;
}

export function LessonDetailModal({ lesson, studentId, onClose, isTeacher = false }: LessonDetailModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [copied, setCopied] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [manualSummary, setManualSummary] = useState('');
  const [savingManualSummary, setSavingManualSummary] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchRatings();
    fetchComments();
  }, [lesson.id]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch(`/api/ai-summaries?lessonId=${lesson.id}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summaryText);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchRatings = async () => {
    setLoadingRatings(true);
    try {
      const lessonResponse = await fetch(`/api/lessons?id=${lesson.id}`);
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        const response = await fetch(`/api/ratings?teacherId=${lessonData.teacherId}&limit=50`);
        if (response.ok) {
          const data = await response.json();
          setRatings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/lesson-comments?lessonId=${lesson.id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!studentId || !newComment.trim()) {
      toast.error('يرجى كتابة تعليق');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch('/api/lesson-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          studentId,
          commentText: newComment.trim()
        })
      });

      if (response.ok) {
        toast.success('تم إضافة التعليق بنجاح');
        setNewComment('');
        fetchComments();
      } else {
        toast.error('فشل إضافة التعليق');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التعليق');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveManualSummary = async () => {
    if (!manualSummary.trim()) {
      toast.error('يرجى كتابة الملخص');
      return;
    }

    setSavingManualSummary(true);
    try {
      const response = await fetch('/api/ai-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          summaryText: manualSummary.trim()
        })
      });

      if (response.ok) {
        toast.success('تم حفظ الملخص بنجاح');
        setSummary(manualSummary.trim());
        setShowManualInput(false);
        setManualSummary('');
      } else {
        toast.error('فشل حفظ الملخص');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الملخص');
    } finally {
      setSavingManualSummary(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!studentId || userRating === 0) {
      toast.error('يرجى اختيار تقييم');
      return;
    }

    setSubmittingRating(true);
    try {
      const lessonResponse = await fetch(`/api/lessons?id=${lesson.id}`);
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            teacherId: lessonData.teacherId,
            folderId: lessonData.folderId,
            rating: userRating,
            reviewText: reviewText || null,
          }),
        });

        if (response.ok) {
          toast.success('تم إضافة التقييم بنجاح');
          setUserRating(0);
          setReviewText('');
          fetchRatings();
        } else {
          toast.error('فشل إضافة التقييم');
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة التقييم');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, action: 'process-all' })
      });

      if (response.ok) {
        toast.success('تم إنشاء الملخص بنجاح!');
        await fetchSummary();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء الملخص');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الملخص');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('تم نسخ الملخص بنجاح');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('فشل نسخ الملخص');
    }
  };

  const videoEmbedUrl = lesson.videoUrl && isYouTubeUrl(lesson.videoUrl) 
    ? getYouTubeEmbedUrl(lesson.videoUrl) 
    : null;

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Hero Header with Image */}
        {lesson.coverImage && (
          <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <img src={lesson.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-4 right-4">
              <h2 className="text-2xl font-bold text-foreground drop-shadow-lg">{lesson.title}</h2>
              {lesson.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTimeSince(lesson.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!lesson.coverImage && (
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-right">{lesson.title}</DialogTitle>
            {lesson.createdAt && (
              <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                <span>({formatTimeSince(lesson.createdAt)})</span>
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}
          </DialogHeader>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="video" disabled={!lesson.videoUrl} className="text-xs sm:text-sm">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">الفيديو</span>
            </TabsTrigger>
            <TabsTrigger value="study" disabled={!lesson.studyPdfUrl} className="text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">المذاكرة</span>
            </TabsTrigger>
            <TabsTrigger value="homework" disabled={!lesson.homeworkPdfUrl} className="text-xs sm:text-sm">
              <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">الواجب</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">الملخص</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="text-xs sm:text-sm">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">بطاقات</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs sm:text-sm">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              <span className="hidden sm:inline">التعليقات</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="video" className="mt-0">
              {lesson.videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                    {videoEmbedUrl ? (
                      <iframe
                        src={videoEmbedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={lesson.title}
                      />
                    ) : (
                      <video src={lesson.videoUrl} controls controlsList="nodownload" className="w-full h-full">
                        متصفحك لا يدعم تشغيل الفيديو
                      </video>
                    )}
                  </div>
                  
                  {lesson.lessonNotes && (
                    <Card className="p-4 bg-card/50 border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileCheck2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-2">ملاحظات المعلم</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {lesson.lessonNotes}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Ratings Section */}
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">التقييمات والمراجعات</h3>
                    </div>

                    {/* Average Rating */}
                    {ratings.length > 0 && (
                      <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(averageRating)
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{ratings.length} تقييم</p>
                        </div>
                      </div>
                    )}

                    {/* Add Rating */}
                    {studentId && (
                      <div className="mb-6 p-4 border border-border rounded-lg">
                        <h4 className="font-medium mb-3">قيّم تجربتك</h4>
                        <div className="flex items-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setUserRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= userRating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="اكتب تعليقك (اختياري)"
                          className="mb-3 text-right"
                          rows={3}
                        />
                        <Button
                          onClick={handleSubmitRating}
                          disabled={submittingRating || userRating === 0}
                          className="w-full"
                        >
                          {submittingRating ? (
                            <>
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              جارٍ الإرسال...
                            </>
                          ) : (
                            'إرسال التقييم'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Ratings List */}
                    {loadingRatings ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : ratings.length > 0 ? (
                      <div className="space-y-4">
                        {ratings.slice(0, 5).map((rating) => (
                          <div key={rating.id} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= rating.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(rating.createdAt).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                            {rating.reviewText && (
                              <p className="text-sm text-foreground">{rating.reviewText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        لا توجد تقييمات بعد. كن أول من يقيّم!
                      </p>
                    )}
                  </Card>
                </div>
              ) : (
                <Card className="p-8 sm:p-12 text-center">
                  <Video className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">لا يوجد فيديو لهذا الدرس</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="study" className="mt-0">
              {lesson.studyPdfUrl ? (
                <div className="space-y-4">
                  <iframe src={lesson.studyPdfUrl} className="w-full h-[400px] sm:h-[600px] rounded-lg border border-border" title="Study PDF" />
                  <Button className="w-full transition-all hover:scale-105" asChild>
                    <a href={lesson.studyPdfUrl} target="_blank" rel="noopener noreferrer">فتح في نافذة جديدة</a>
                  </Button>
                </div>
              ) : (
                <Card className="p-8 sm:p-12 text-center">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">لا يوجد ملف مذاكرة لهذا الدرس</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="homework" className="mt-0">
              {lesson.homeworkPdfUrl ? (
                <div className="space-y-4">
                  <iframe src={lesson.homeworkPdfUrl} className="w-full h-[400px] sm:h-[600px] rounded-lg border border-border" title="Homework PDF" />
                  <HomeworkQuiz lessonId={lesson.id} studentId={studentId} />
                </div>
              ) : (
                <Card className="p-8 sm:p-12 text-center">
                  <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">لا يوجد واجب لهذا الدرس</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              {loadingSummary ? (
                <Card className="p-8 sm:p-12 text-center">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">جارٍ تحميل الملخص...</p>
                </Card>
              ) : summary ? (
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <h3 className="font-bold text-base sm:text-lg">ملخص الدرس</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopySummary} className="gap-2">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span className="text-xs sm:text-sm">{copied ? 'تم' : 'نسخ'}</span>
                    </Button>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap leading-relaxed">{summary}</p>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 sm:p-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">لم يتم إنشاء ملخص لهذا الدرس بعد</h3>
                    
                    {isTeacher && showManualInput ? (
                      <div className="space-y-3">
                        <Textarea
                          value={manualSummary}
                          onChange={(e) => setManualSummary(e.target.value)}
                          placeholder="اكتب ملخص الدرس هنا..."
                          rows={6}
                          className="text-right"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveManualSummary} disabled={savingManualSummary} className="flex-1">
                            {savingManualSummary ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                            حفظ الملخص
                          </Button>
                          <Button variant="outline" onClick={() => setShowManualInput(false)}>إلغاء</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button onClick={handleGenerateSummary} disabled={generatingSummary} className="w-full" size="lg">
                          {generatingSummary ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                          إنشاء ملخص بالذكاء الاصطناعي
                        </Button>
                        {isTeacher && (
                          <Button variant="outline" onClick={() => setShowManualInput(true)} className="w-full">
                            <PenLine className="w-4 h-4 ml-2" />
                            كتابة ملخص يدوي
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="flashcards" className="mt-0">
              <FlashcardViewer lessonId={lesson.id} />
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-0">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">تعليقات الطلاب ({comments.length})</h3>
                </div>

                {/* Add Comment */}
                {studentId && !isTeacher && (
                  <div className="mb-6 p-4 border border-border rounded-lg bg-secondary/20">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقك على الحصة..."
                      className="mb-3 text-right"
                      rows={3}
                    />
                    <Button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()} className="w-full">
                      {submittingComment ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                      إرسال التعليق
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{comment.studentName || 'طالب'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.commentText}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد تعليقات بعد. {studentId && !isTeacher && 'كن أول من يعلق!'}
                  </p>
                )}
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}