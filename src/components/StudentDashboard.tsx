"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, Settings, FolderOpen, ClipboardList, Sparkles, Library, Star, User, CreditCard, UserCircle, Building2, Users, Megaphone, Filter, Crown, Key, Video, BarChart3, CheckCircle2, ExternalLink } from 'lucide-react';
import { StudentFolderView } from './StudentFolderView';
import { StudentSettings } from './StudentSettings';
import { StudentSubscriptionDialog } from './StudentSubscriptionDialog';
import { StudentProfileView } from './StudentProfileView';
import { StudentStatsPage } from './StudentStatsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeworkListView } from './HomeworkListView';
import { SummariesListView } from './SummariesListView';
import { FlashcardsListView } from './FlashcardsListView';
import Image from 'next/image';
import { toast } from 'sonner';

interface Folder {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
  coverImage?: string;
  createdAt: string;
}

interface TeacherInfo {
  id: number;
  name: string;
  subjects: string | null;
  centerName?: string;
  groupName?: string;
  averageRating?: number;
  totalRatings?: number;
  profileImage?: string;
  heroImage?: string;
}

interface Subscription {
  folderId: number;
  isActive: boolean;
}

interface LiveSession {
  id: number;
  title: string;
  description: string | null;
  zoomLink: string;
  isFree: boolean;
  scheduledAt: string;
  status: string;
  folderName: string;
  teacherName: string;
  folderId: number;
}

const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  '4-primary': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'],
  '5-primary': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'],
  '6-primary': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية'],
  '1-preparatory': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات (جبر)', 'الرياضيات (هندسة)', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية', 'الحاسب الآلي'],
  '2-preparatory': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات (جبر)', 'الرياضيات (هندسة)', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية', 'الحاسب الآلي'],
  '3-preparatory': ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات (جبر)', 'الرياضيات (هندسة)', 'العلوم', 'الدراسات الاجتماعية', 'التربية الدينية', 'الحاسب الآلي'],
  '1-secondary': ['اللغة العربية', 'اللغة الإنجليزية', 'اللغة الأجنبية الثانية', 'الرياضيات', 'العلوم المتكاملة', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'علم النفس'],
  '2-secondary': ['اللغة العربية', 'اللغة الإنجليزية', 'اللغة الأجنبية الثانية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'علم النفس'],
  '3-secondary': ['اللغة العربية', 'اللغة الإنجليزية', 'اللغة الأجنبية الثانية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'علم النفس'],
};

export function StudentDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [teachersInfo, setTeachersInfo] = useState<Map<number, TeacherInfo>>(new Map());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState('folders');
  const [sortBy, setSortBy] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [joiningSession, setJoiningSession] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get('view') === 'stats') {
      setShowStats(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFolders();
    fetchSubscriptions();
    fetchLiveSessions();
  }, [user]);

  useEffect(() => {
    let filtered = [...folders];
    
    if (filterTeacher !== 'all') {
      filtered = filtered.filter(f => f.teacherId === parseInt(filterTeacher));
    }
    
    if (sortBy === 'subject') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'teacher') {
      filtered.sort((a, b) => {
        const teacherA = teachersInfo.get(a.teacherId)?.name || '';
        const teacherB = teachersInfo.get(b.teacherId)?.name || '';
        return teacherA.localeCompare(teacherB, 'ar');
      });
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => {
        const ratingA = teachersInfo.get(a.teacherId)?.averageRating || 0;
        const ratingB = teachersInfo.get(b.teacherId)?.averageRating || 0;
        return ratingB - ratingA;
      });
    }
    
    setFilteredFolders(filtered);
  }, [sortBy, filterTeacher, folders, teachersInfo]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/lesson-folders?grade=${user?.grade}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
        setFilteredFolders(data);
        await fetchTeachersInfo(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`/api/subscriptions?studentId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const response = await fetch(`/api/live-sessions?status=scheduled`);
      if (response.ok) {
        const data = await response.json();
        setLiveSessions(data.filter((s: LiveSession) => new Date(s.scheduledAt) >= new Date()));
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error);
    }
  };

  const handleJoinSession = async (session: LiveSession) => {
    const isSubscribed = subscriptions.some(s => s.folderId === session.folderId && s.isActive);
    
    if (!session.isFree && !isSubscribed) {
      toast.error('يجب الاشتراك للوصول إلى هذا اللايف');
      return;
    }

    setJoiningSession(session.id);
    
    try {
      await fetch('/api/live-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveSessionId: session.id,
          studentId: user?.id,
        }),
      });

      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: session.zoomLink } }, "*");
      toast.success('تم تسجيل حضورك بنجاح ✓');
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setJoiningSession(null);
    }
  };

  const fetchTeachersInfo = async (foldersList: Folder[]) => {
    const teacherIds = [...new Set(foldersList.map(f => f.teacherId))];
    const teachersMap = new Map<number, TeacherInfo>();

    for (const teacherId of teacherIds) {
      try {
        const teacherResponse = await fetch(`/api/users?id=${teacherId}`);
        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json();
          
          const ratingsResponse = await fetch(`/api/ratings?teacherId=${teacherId}&limit=100`);
          let averageRating = 0;
          let totalRatings = 0;
          
          if (ratingsResponse.ok) {
            const ratings = await ratingsResponse.json();
            if (ratings.length > 0) {
              const total = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
              averageRating = total / ratings.length;
              totalRatings = ratings.length;
            }
          }
          
          teachersMap.set(teacherId, {
            id: teacherData.id,
            name: teacherData.name,
            subjects: teacherData.subjects,
            centerName: teacherData.centerName,
            groupName: teacherData.groupName,
            averageRating,
            totalRatings,
            profileImage: teacherData.profileImage,
            heroImage: teacherData.heroImage,
          });
        }
      } catch (error) {
        console.error(`Error fetching teacher ${teacherId}:`, error);
      }
    }
    
    setTeachersInfo(teachersMap);
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
      '3-secondary': 'الثالث الثانوي',
    };
    return labels[grade] || grade;
  };

  const isSubscribed = (folderId: number) => {
    return subscriptions.some(s => s.folderId === folderId && s.isActive);
  };

  const hasAnySubscription = subscriptions.some(s => s.isActive);
  const uniqueTeachers = Array.from(teachersInfo.values());

  if (showStats) {
    return <StudentStatsPage onBack={() => setShowStats(false)} />;
  }

  if (showSettings) {
    return <StudentSettings onBack={() => setShowSettings(false)} />;
  }

  if (selectedFolder) {
    return (
      <StudentFolderView
        folder={selectedFolder}
        studentId={user?.id}
        onBack={() => setSelectedFolder(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 page-transition">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <BookOpen className="w-5 h-5 text-primary animate-icon-bounce icon-colorful" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">{user?.name}</h1>
                {hasAnySubscription && (
                  <Crown className="w-4 h-4 text-yellow-500 subscriber-badge" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{user?.grade && getGradeLabel(user.grade)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowStats(true)} className="btn-animate">
              <BarChart3 className="w-4 h-4 sm:ml-2 text-cyan-500 icon-colorful" />
              <span className="hidden sm:inline">إحصائياتي</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSubscription(true)} className="btn-animate">
              <CreditCard className="w-4 h-4 sm:ml-2 text-green-500 icon-colorful" />
              <span className="hidden sm:inline">الاشتراك</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="btn-animate">
              <Settings className="w-4 h-4 sm:ml-2 text-blue-500 icon-colorful" />
              <span className="hidden sm:inline">الإعدادات</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Scrolling Announcement */}
      <div className="md:hidden bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2">
          <span className="text-sm text-foreground/90 font-medium mx-4">
            🎉 مرحباً بكم في منصة التعليم المصرية • ابدأ رحلتك التعليمية الآن مع أفضل المعلمين 📚
          </span>
          <span className="text-sm text-foreground/90 font-medium mx-4">
            🎉 مرحباً بكم في منصة التعليم المصرية • ابدأ رحلتك التعليمية الآن مع أفضل المعلمين 📚
          </span>
        </div>
      </div>

      <div className="hidden md:block bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 justify-center animate-slide-in-right">
            <Megaphone className="w-5 h-5 text-primary flex-shrink-0 animate-bounce-subtle" />
            <p className="text-sm text-foreground/90 font-medium">
              🎉 مرحباً بكم في منصة التعليم المصرية • ابدأ رحلتك التعليمية الآن مع أفضل المعلمين
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Live Sessions Section */}
        {liveSessions.length > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/20">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500 animate-pulse" />
              حصص لايف قادمة
            </h3>
            <div className="space-y-3">
              {liveSessions.slice(0, 3).map((session) => {
                const isSubscribed = subscriptions.some(s => s.folderId === session.folderId && s.isActive);
                const canJoin = session.isFree || isSubscribed;
                
                return (
                  <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{session.title}</p>
                        {session.isFree && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full">مجاني</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.teacherName} • {session.folderName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.scheduledAt).toLocaleDateString('ar-EG')} - {new Date(session.scheduledAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinSession(session)}
                      disabled={!canJoin || joiningSession === session.id}
                      className={canJoin ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      {joiningSession === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : canJoin ? (
                        <>
                          <ExternalLink className="w-4 h-4 ml-2" />
                          ادخل الحصة
                        </>
                      ) : (
                        'اشترك أولاً'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="folders" className="text-xs sm:text-sm relative">
                <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-yellow-500 icon-colorful" />
                <span>المواد</span>
              </TabsTrigger>
              <TabsTrigger value="homework" className="text-xs sm:text-sm">
                <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-orange-500 icon-colorful" />
                <span>الواجبات</span>
              </TabsTrigger>
              <TabsTrigger value="summaries" className="text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-purple-500 icon-colorful" />
                <span>الملخصات</span>
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="text-xs sm:text-sm">
                <Library className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-pink-500 icon-colorful" />
                <span>البطاقات</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="folders" className="space-y-6 page-slide-left">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">المواد الدراسية</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="ترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="subject">حسب المادة</SelectItem>
                      <SelectItem value="teacher">حسب المعلم</SelectItem>
                      <SelectItem value="rating">حسب التقييم</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                    <SelectTrigger className="w-[140px]">
                      <User className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المعلمين</SelectItem>
                      {uniqueTeachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {user?.grade && SUBJECTS_BY_GRADE[user.grade] && (
                <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    مواد {getGradeLabel(user.grade)}
                  </h3>
                  <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="flex gap-2 pb-2" style={{ touchAction: 'pan-x' }}>
                      {SUBJECTS_BY_GRADE[user.grade].map((subject, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 px-4 py-2 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-default"
                        >
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            📚 {subject}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredFolders.length === 0 ? (
              <Card className="p-12 text-center">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مواد</h3>
                <p className="text-muted-foreground">لم يتم إضافة مواد لصفك الدراسي بعد</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {filteredFolders.map((folder) => {
                  const teacherInfo = teachersInfo.get(folder.teacherId);
                  const subjectsArray = teacherInfo?.subjects ? teacherInfo.subjects.split(',').map(s => s.trim()) : [];
                  const subscribed = isSubscribed(folder.id);
                  const folderImage = folder.coverImage || teacherInfo?.heroImage || "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/8d99043c-25ea-4e96-aa89-af09482cbae3/generated_images/professional-egyptian-male-teacher-in-fo-bd52e167-20251208031722.jpg";
                  
                  return (
                    <Card
                      key={folder.id}
                      className={`p-4 sm:p-6 hover:border-primary cursor-pointer transition-all hover:shadow-lg card-hover w-full animate-scale-in overflow-hidden ${subscribed ? 'border-yellow-500/50' : ''}`}
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="relative w-full sm:w-48 h-32 sm:h-48 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-primary/30 shadow-2xl hover:scale-105 transition-transform duration-300 animate-float">
                          <Image
                            src={folderImage}
                            alt={folder.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                          {subscribed && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1 subscriber-badge">
                              <Crown className="w-3 h-3" />
                              مشترك
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 w-full space-y-4">
                          <h3 className="text-xl sm:text-2xl font-bold text-foreground animate-slide-in-right">{folder.name}</h3>
                          <p className="text-sm sm:text-base text-muted-foreground">{getGradeLabel(folder.grade)}</p>
                          
                          {teacherInfo && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-5 h-5 text-blue-500 flex-shrink-0 icon-colorful" />
                                  <span className="text-base sm:text-lg text-foreground font-semibold">{teacherInfo.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 transition-all hover:scale-125 icon-colorful ${
                                        teacherInfo.totalRatings && teacherInfo.totalRatings > 0 && star <= Math.round(teacherInfo.averageRating || 0)
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'text-muted-foreground/40'
                                      }`}
                                    />
                                  ))}
                                  {teacherInfo.totalRatings && teacherInfo.totalRatings > 0 && (
                                    <span className="text-xs text-yellow-500 mr-1">
                                      ({teacherInfo.averageRating?.toFixed(1)})
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 text-sm rounded-full border border-green-500/30 hover:scale-105 transition-transform">
                                  <Building2 className="w-4 h-4" />
                                  <span>{teacherInfo.centerName || 'مستقل'}</span>
                                </div>
                                
                                {teacherInfo.groupName && (
                                  <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 text-sm rounded-full border border-blue-500/30 hover:scale-105 transition-transform">
                                    <Users className="w-4 h-4" />
                                    <span>{teacherInfo.groupName}</span>
                                  </div>
                                )}
                              </div>
                              
                              {subjectsArray.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {subjectsArray.map((subject, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-sm rounded-full border border-primary/20 hover:scale-105 transition-transform animate-gradient-shift"
                                    >
                                      📚 {subject}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="homework" className="page-slide-left">
            <HomeworkListView studentId={user?.id!} grade={user?.grade!} />
          </TabsContent>

          <TabsContent value="summaries" className="page-slide-left">
            <SummariesListView studentId={user?.id!} grade={user?.grade!} />
          </TabsContent>

          <TabsContent value="flashcards" className="page-slide-left">
            <FlashcardsListView studentId={user?.id!} grade={user?.grade!} />
          </TabsContent>
        </Tabs>
      </main>

      {showSubscription && user && (
        <StudentSubscriptionDialog
          isOpen={showSubscription}
          onClose={() => setShowSubscription(false)}
          studentId={user.id}
          studentGrade={user.grade!}
        />
      )}
    </div>
  );
}