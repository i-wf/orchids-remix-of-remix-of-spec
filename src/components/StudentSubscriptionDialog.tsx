"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, FolderOpen, CheckCircle2, User, Star, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PaymentGatewaySelector } from './PaymentGatewaySelector';

interface Folder {
  id: number;
  name: string;
  grade: string;
  teacherId: number;
}

interface TeacherInfo {
  id: number;
  name: string;
  subjects: string | null;
  averageRating?: number;
  totalRatings?: number;
}

interface Subscription {
  id: number;
  studentId: number;
  folderId: number;
}

interface StudentSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentGrade: string;
}

export function StudentSubscriptionDialog({ isOpen, onClose, studentId, studentGrade }: StudentSubscriptionDialogProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [teachersInfo, setTeachersInfo] = useState<Map<number, TeacherInfo>>(new Map());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedFolderForPayment, setSelectedFolderForPayment] = useState<Folder | null>(null);
  const [paymentAmount] = useState(100); // Default amount in EGP

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, studentId, studentGrade]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFolders(),
        fetchSubscriptions(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/lesson-folders?grade=${studentGrade}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
        await fetchTeachersInfo(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
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
            averageRating,
            totalRatings,
          });
        }
      } catch (error) {
        console.error(`Error fetching teacher ${teacherId}:`, error);
      }
    }
    
    setTeachersInfo(teachersMap);
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`/api/subscriptions?studentId=${studentId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleSubscribe = async (folderId: number) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Show payment dialog instead of direct subscription
    setSelectedFolderForPayment(folder);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setSelectedFolderForPayment(null);
    toast.success('تم إرسال طلب الدفع بنجاح! سيتم تفعيل الاشتراك بعد تأكيد الدفع.');
    await fetchSubscriptions();
  };

  const handleUnsubscribe = async (folderId: number) => {
    const subscription = subscriptions.find(s => s.folderId === folderId);
    if (!subscription) return;

    setActionLoading(folderId);
    try {
      const response = await fetch(`/api/subscriptions?id=${subscription.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('تم إلغاء الاشتراك من المادة');
        await fetchSubscriptions();
      } else {
        toast.error('فشل إلغاء الاشتراك');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إلغاء الاشتراك');
    } finally {
      setActionLoading(null);
    }
  };

  const isSubscribed = (folderId: number) => {
    return subscriptions.some(s => s.folderId === folderId);
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

  const filteredFolders = searchQuery.trim() === ''
    ? folders
    : folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (showPayment && selectedFolderForPayment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-base sm:text-lg">الدفع والاشتراك</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="bg-accent/20 p-3 sm:p-4 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">المادة المختارة</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{selectedFolderForPayment.name}</p>
              <p className="text-xs text-muted-foreground">{getGradeLabel(selectedFolderForPayment.grade)}</p>
            </div>

            <PaymentGatewaySelector
              studentId={studentId}
              folderId={selectedFolderForPayment.id}
              amount={paymentAmount}
              folderName={selectedFolderForPayment.name}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowPayment(false)} className="rounded-xl">
              رجوع
            </Button>
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-right text-base sm:text-lg">الاشتراك في المواد</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن مادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right rounded-xl text-sm sm:text-base"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                {searchQuery ? 'لم يتم العثور على مواد مطابقة' : 'لا توجد مواد متاحة'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredFolders.map((folder) => {
                const teacherInfo = teachersInfo.get(folder.teacherId);
                const subscribed = isSubscribed(folder.id);
                const subjectsArray = teacherInfo?.subjects ? teacherInfo.subjects.split(',').map(s => s.trim()) : [];

                return (
                  <Card key={folder.id} className={`p-3 sm:p-4 rounded-xl ${subscribed ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">{folder.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{getGradeLabel(folder.grade)}</p>
                          </div>
                        </div>

                        {/* Teacher Info */}
                        {teacherInfo && (
                          <div className="space-y-1.5 sm:space-y-2 mr-0 sm:mr-15">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                              <span className="text-foreground font-medium">{teacherInfo.name}</span>
                            </div>

                            {subjectsArray.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {subjectsArray.slice(0, 2).map((subject, index) => (
                                  <span
                                    key={index}
                                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs rounded-full border border-primary/20"
                                  >
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            )}

                            {teacherInfo.totalRatings! > 0 && (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                        star <= Math.round(teacherInfo.averageRating!)
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] sm:text-sm text-muted-foreground">
                                  ({teacherInfo.averageRating!.toFixed(1)})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 w-full sm:w-auto">
                        {subscribed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnsubscribe(folder.id)}
                            disabled={actionLoading === folder.id}
                            className="w-full sm:w-auto rounded-xl"
                          >
                            {actionLoading === folder.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                                مشترك
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSubscribe(folder.id)}
                            disabled={actionLoading === folder.id}
                            className="w-full sm:w-auto gap-2 rounded-xl"
                          >
                            {actionLoading === folder.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                اشترك ({paymentAmount} جنيه)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}