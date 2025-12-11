"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderPlus, FilePlus, BookOpen, Download, Settings, Star, UserPlus, Users, Key, BarChart3, Video } from 'lucide-react';
import { CreateFolderDialog } from './CreateFolderDialog';
import { CreateLessonDialog } from './CreateLessonDialog';
import { CreateLiveSessionDialog } from './CreateLiveSessionDialog';
import { LessonManagementView } from './LessonManagementView';
import { TeacherDownloadsView } from './TeacherDownloadsView';
import { TeacherSettings } from './TeacherSettings';
import { TeacherProfilePage } from './TeacherProfilePage';
import { SecretaryManagement } from './SecretaryManagement';
import { TeacherSubscriptionCodes } from './TeacherSubscriptionCodes';
import { TeacherStudentTracking } from './TeacherStudentTracking';

interface Folder {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
  coverImage?: string;
  createdAt: string;
}

interface Rating {
  id: number;
  rating: number;
  reviewText: string | null;
  studentName: string;
  createdAt: string;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCreateLive, setShowCreateLive] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSecretary, setShowSecretary] = useState(false);
  const [showSubscriptionCodes, setShowSubscriptionCodes] = useState(false);
  const [showStudentTracking, setShowStudentTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchFolders();
    fetchRatings();
  }, [user]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/lesson-folders?teacherId=${user?.id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/ratings?teacherId=${user?.id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
        if (data.length > 0) {
          const total = data.reduce((sum: number, r: Rating) => sum + r.rating, 0);
          setAverageRating(total / data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const getGradeLabel = (grade: string) => {
    const labels: Record<string, string> = {
      '4-primary': 'الرابع الابتدائي',
      '5-primary': 'الخامس الابتدائي',
      '6-primary': 'السادس الابتدائي',
      '1-preparatory': 'الأول الإعدادي',
      '2-preparatory': 'الثاني الإعدادي',
      '3-preparatory': 'الثالث الإعدادي',
      '1-secondary': 'الأول الثانوي',
      '2-secondary': 'الثاني الثانوي',
      '3-secondary': 'الثالث الثانوي'
    };
    return labels[grade] || grade;
  };

  if (showSettings) {
    return <TeacherSettings onBack={() => setShowSettings(false)} />;
  }

  if (showDownloads) {
    return <TeacherDownloadsView onBack={() => setShowDownloads(false)} />;
  }

  if (showProfile) {
    return <TeacherProfilePage onBack={() => setShowProfile(false)} teacherId={user?.id!} />;
  }

  if (showSecretary) {
    return <SecretaryManagement onBack={() => setShowSecretary(false)} teacherId={user?.id!} />;
  }

  if (showSubscriptionCodes) {
    return <TeacherSubscriptionCodes onBack={() => setShowSubscriptionCodes(false)} teacherId={user?.id!} />;
  }

  if (showStudentTracking) {
    return <TeacherStudentTracking onBack={() => setShowStudentTracking(false)} teacherId={user?.id!} />;
  }

  if (selectedFolder) {
    return (
      <LessonManagementView
        folder={selectedFolder}
        onBack={() => setSelectedFolder(null)}
        onRefresh={fetchFolders} />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{user?.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">معلم</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className={`w-3 h-3 ${star <= Math.round(averageRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                  ))}
                  {ratings.length > 0 && <span className="text-xs text-yellow-500">({averageRating.toFixed(1)})</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowStudentTracking(true)} className="btn-animate flex-1 sm:flex-none">
              <BarChart3 className="w-4 h-4 sm:ml-2 text-cyan-500" />
              <span className="hidden sm:inline">متابعة الطلاب</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="btn-animate flex-1 sm:flex-none">
              <Star className="w-4 h-4 sm:ml-2 text-yellow-500" />
              <span className="hidden sm:inline">ملفي</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSubscriptionCodes(true)} className="btn-animate flex-1 sm:flex-none">
              <Key className="w-4 h-4 sm:ml-2 text-green-500" />
              <span className="hidden sm:inline">أكواد الاشتراك</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSecretary(true)} className="btn-animate flex-1 sm:flex-none">
              <UserPlus className="w-4 h-4 sm:ml-2 text-blue-500" />
              <span className="hidden sm:inline">السكرتير</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDownloads(true)} className="btn-animate flex-1 sm:flex-none">
              <Download className="w-4 h-4 sm:ml-2 text-purple-500" />
              <span className="hidden sm:inline">رفع الملفات</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="btn-animate flex-1 sm:flex-none">
              <Settings className="w-4 h-4 sm:ml-2 text-gray-500" />
              <span className="hidden sm:inline">الإعدادات</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">موادي</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowCreateFolder(true)} className="btn-animate flex-1 sm:flex-none">
              <FolderPlus className="w-4 h-4 ml-2" />
              مادة جديدة
            </Button>
            <Button variant="outline" onClick={() => setShowCreateLesson(true)} className="btn-animate flex-1 sm:flex-none">
              <FilePlus className="w-4 h-4 ml-2" />
              درس جديد
            </Button>
            <Button variant="outline" onClick={() => setShowCreateLive(true)} className="btn-animate flex-1 sm:flex-none bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:text-red-400">
              <Video className="w-4 h-4 ml-2" />
              إنشاء لايف
            </Button>
          </div>
        </div>

        {folders.length === 0 ?
        <Card className="p-8 sm:p-12 text-center">
          <FolderPlus className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مواد</h3>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">ابدأ بإنشاء مادة جديدة لتنظيم دروسك</p>
          <Button onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="w-4 h-4 ml-2" />
            إنشاء مادة
          </Button>
        </Card> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) =>
            <Card
              key={folder.id}
              className="hover:border-primary cursor-pointer transition-all card-hover overflow-hidden"
              onClick={() => setSelectedFolder(folder)}>
              {folder.coverImage ? (
                <div className="relative h-32 w-full">
                  <img
                    src={folder.coverImage}
                    alt={folder.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 truncate">{folder.name}</h3>
                    <p className="text-xs sm:text-sm text-white/80">{getGradeLabel(folder.grade)}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 truncate">{folder.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{getGradeLabel(folder.grade)}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
        }
      </main>

      {showCreateFolder &&
        <CreateFolderDialog
          teacherId={user?.id!}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => {
            setShowCreateFolder(false);
            fetchFolders();
          }} />
      }

      {showCreateLesson &&
        <CreateLessonDialog
          teacherId={user?.id!}
          folders={folders}
          onClose={() => setShowCreateLesson(false)}
          onSuccess={() => {
            setShowCreateLesson(false);
            fetchFolders();
          }} />
      }

      {showCreateLive &&
        <CreateLiveSessionDialog
          teacherId={user?.id!}
          folders={folders}
          onClose={() => setShowCreateLive(false)}
          onSuccess={() => {
            setShowCreateLive(false);
          }} />
      }
    </div>
  );
}