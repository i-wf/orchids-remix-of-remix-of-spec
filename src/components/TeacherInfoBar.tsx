"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Star, User, GraduationCap, Calendar, MessageCircle, BookOpen, Award, TrendingUp } from 'lucide-react';
import { RatingDialog } from './RatingDialog';
import { toast } from 'sonner';

interface TeacherInfo {
  id: number;
  name: string;
  phone: string;
  age: number | null;
  subjects: string | null;
  createdAt: string;
}

interface Rating {
  id: number;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

interface TeacherInfoBarProps {
  teacherId: number;
  folderId: number;
  studentId: number;
  grade: string;
}

export function TeacherInfoBar({ teacherId, folderId, studentId, grade }: TeacherInfoBarProps) {
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [totalFolders, setTotalFolders] = useState<number>(0);
  const [myRating, setMyRating] = useState<Rating | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherInfo();
    fetchRatings();
    fetchTeacherStats();
  }, [teacherId, folderId, studentId]);

  const fetchTeacherInfo = async () => {
    try {
      const response = await fetch(`/api/users?id=${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setTeacher(data);
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      // Fetch all ratings for this teacher and folder
      const response = await fetch(`/api/ratings?teacherId=${teacherId}&folderId=${folderId}&limit=100`);
      if (response.ok) {
        const ratings = await response.json();
        
        if (ratings.length > 0) {
          const total = ratings.reduce((sum: number, r: Rating) => sum + r.rating, 0);
          setAverageRating(total / ratings.length);
          setTotalRatings(ratings.length);
        }

        // Check if student already rated
        const myRatingData = ratings.find((r: Rating & { studentId: number }) => r.studentId === studentId);
        setMyRating(myRatingData || null);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const response = await fetch(`/api/lesson-folders?teacherId=${teacherId}&limit=100`);
      if (response.ok) {
        const folders = await response.json();
        setTotalFolders(folders.length);
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const handleRatingSubmit = async (rating: number, reviewText: string) => {
    try {
      if (myRating) {
        // Update existing rating
        const response = await fetch(`/api/ratings?id=${myRating.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, reviewText }),
        });

        if (!response.ok) throw new Error('Failed to update rating');
        toast.success('تم تحديث التقييم بنجاح!');
      } else {
        // Create new rating
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            teacherId,
            folderId,
            rating,
            reviewText: reviewText || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to submit rating');
        }
        toast.success('تم إضافة التقييم بنجاح!');
      }

      setShowRatingDialog(false);
      fetchRatings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    }
  };

  const getGradeLabel = (gradeValue: string) => {
    const labels: Record<string, string> = {
      '4-primary': 'الرابع الابتدائي',
      '5-primary': 'الخامس الابتدائي',
      '6-primary': 'السادس الابتدائي',
      '1-preparatory': 'الأول الإعدادي',
      '2-preparatory': 'الثاني الإعدادي',
      '3-preparatory': 'الثالث الإعدادي',
      '1-secondary': 'الأول الثانوي',
      '2-secondary': 'الثاني الثانوي',
      '3-secondary': 'الثالث الثانوي',
    };
    return labels[gradeValue] || gradeValue;
  };

  if (loading || !teacher) {
    return null;
  }

  const subjectsArray = teacher.subjects ? teacher.subjects.split(',').map(s => s.trim()) : [];

  return (
    <>
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 via-card to-primary/5 border-primary/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Teacher Info Section */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/30 flex-shrink-0">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-foreground">{teacher.name}</h3>
                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/30 font-medium">
                  معلم معتمد
                </span>
              </div>
              
              {/* Teacher Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>{getGradeLabel(grade)}</span>
                </div>
                
                {teacher.age && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{teacher.age} سنة</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span dir="ltr">{teacher.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{totalFolders} مجلد</span>
                </div>
              </div>

              {/* Subjects Tags */}
              {subjectsArray.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {subjectsArray.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats & Rating Section */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Rating Display */}
            {totalRatings > 0 && (
              <div className="flex-1 lg:flex-none text-center px-6 py-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border shadow-sm">
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating) ? 'fill-current' : ''
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-bold text-foreground">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalRatings} تقييم
                </p>
              </div>
            )}

            {/* Rating Button */}
            <Button
              onClick={() => setShowRatingDialog(true)}
              variant={myRating ? "outline" : "default"}
              size="lg"
              className="flex-1 lg:flex-none min-w-[140px]"
            >
              <Star className={`w-4 h-4 ml-2 ${myRating ? 'fill-current text-yellow-500' : ''}`} />
              {myRating ? 'تعديل التقييم' : 'قيّم المعلم'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Rating Dialog */}
      {showRatingDialog && (
        <RatingDialog
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          onSubmit={handleRatingSubmit}
          teacherName={teacher.name}
          existingRating={myRating?.rating}
          existingReview={myRating?.reviewText || ''}
        />
      )}
    </>
  );
}