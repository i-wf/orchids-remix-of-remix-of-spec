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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-right">الدفع والاشتراك</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-accent/20 p-4 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">المادة المختارة</h3>
              <p className="text-sm text-muted-foreground">{selectedFolderForPayment.name}</p>
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

          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              رجوع
            </Button>
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right">الاشتراك في المواد</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن مادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'لم يتم العثور على مواد مطابقة' : 'لا توجد مواد متاحة'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFolders.map((folder) => {
                const teacherInfo = teachersInfo.get(folder.teacherId);
                const subscribed = isSubscribed(folder.id);
                const subjectsArray = teacherInfo?.subjects ? teacherInfo.subjects.split(',').map(s => s.trim()) : [];

                return (
                  <Card key={folder.id} className={`p-4 ${subscribed ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground">{folder.name}</h3>
                            <p className="text-sm text-muted-foreground">{getGradeLabel(folder.grade)}</p>
                          </div>
                        </div>

                        {/* Teacher Info */}
                        {teacherInfo && (
                          <div className="space-y-2 mr-15">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-foreground font-medium">{teacherInfo.name}</span>
                            </div>

                            {subjectsArray.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {subjectsArray.map((subject, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                                  >
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            )}

                            {teacherInfo.totalRatings! > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= Math.round(teacherInfo.averageRating!)
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  ({teacherInfo.averageRating!.toFixed(1)} • {teacherInfo.totalRatings} تقييم)
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {subscribed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnsubscribe(folder.id)}
                            disabled={actionLoading === folder.id}
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
                            className="gap-2"
                          >
                            {actionLoading === folder.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                اشترك الآن ({paymentAmount} جنيه)
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
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}