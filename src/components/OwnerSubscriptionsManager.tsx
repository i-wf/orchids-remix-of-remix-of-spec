"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Crown, Zap, Gift, Search, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface Subscription {
  id: number;
  studentId: number;
  folderId: number;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  monthlyPrice: number | null;
  grantedByOwnerId: number | null;
}

interface Student {
  id: number;
  name: string;
  phone: string;
  grade: string;
  subscriptionType: string | null;
}

interface Folder {
  id: number;
  name: string;
  grade: string;
}

export function OwnerSubscriptionsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [grantType, setGrantType] = useState<'premium' | 'premium_plus'>('premium');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, subscriptionsRes, foldersRes] = await Promise.all([
        fetch('/api/users?role=student&limit=100'),
        fetch('/api/subscriptions?limit=100'),
        fetch('/api/lesson-folders?limit=100'),
      ]);

      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (subscriptionsRes.ok) setSubscriptions(await subscriptionsRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedStudent || !selectedFolder) {
      toast.error('يرجى اختيار الطالب والمجلد');
      return;
    }

    setGranting(true);
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          folderId: selectedFolder,
          subscriptionType: grantType,
          startDate,
          endDate,
          isActive: true,
          paymentMethod: 'owner_granted',
          monthlyPrice: 0,
          grantedByOwnerId: 1, // Assuming owner ID is 1
        }),
      });

      if (!response.ok) throw new Error('Failed to grant subscription');

      // Create notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          notificationType: 'payment_approved',
          message: `تم منحك اشتراك ${grantType === 'premium' ? 'Premium' : 'Premium Plus'} مجاناً!`,
        }),
      });

      toast.success('تم منح الاشتراك بنجاح!');
      setShowGrantDialog(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء منح الاشتراك');
    } finally {
      setGranting(false);
    }
  };

  const getActiveSubscriptions = (studentId: number) => {
    return subscriptions.filter(
      s => s.studentId === studentId && 
      s.isActive && 
      new Date(s.endDate) > new Date()
    );
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن طالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
          />
        </div>
        <Button onClick={() => setShowGrantDialog(true)}>
          <Gift className="w-4 h-4 ml-2" />
          منح اشتراك
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لا توجد طلاب</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => {
            const activeSubscriptions = getActiveSubscriptions(student.id);
            const hasSubscription = activeSubscriptions.length > 0;

            return (
              <Card key={student.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        ID: {student.id}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{student.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      الصف: {student.grade}
                    </p>

                    {hasSubscription ? (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-foreground">
                          الاشتراكات النشطة ({activeSubscriptions.length}):
                        </p>
                        {activeSubscriptions.map((sub) => {
                          const folder = folders.find(f => f.id === sub.folderId);
                          const daysLeft = Math.ceil(
                            (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                          );

                          return (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                            >
                              {sub.subscriptionType === 'premium' ? (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <Zap className="w-4 h-4 text-orange-500" />
                              )}
                              <div className="flex-1 text-sm">
                                <p className="font-medium">{folder?.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.subscriptionType === 'premium' ? 'Premium' : 'Premium Plus'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {daysLeft} يوم متبقي
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-600 pt-2">
                        لا يوجد اشتراكات نشطة
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowGrantDialog(true);
                    }}
                  >
                    <Gift className="w-4 h-4 ml-2" />
                    منح اشتراك
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grant Subscription Dialog */}
      {showGrantDialog && (
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">منح اشتراك مجاني</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Student Selection */}
              {!selectedStudent && (
                <div className="space-y-2">
                  <Label>اختر الطالب</Label>
                  <select
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    onChange={(e) => {
                      const student = students.find(s => s.id === parseInt(e.target.value));
                      setSelectedStudent(student || null);
                    }}
                  >
                    <option value="">اختر طالب...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedStudent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">الطالب: {selectedStudent.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudent.phone}</p>
                </div>
              )}

              {/* Folder Selection */}
              <div className="space-y-2">
                <Label>اختر المجلد</Label>
                <select
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  value={selectedFolder || ''}
                  onChange={(e) => setSelectedFolder(parseInt(e.target.value) || null)}
                >
                  <option value="">اختر مجلد...</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subscription Type */}
              <div className="space-y-2">
                <Label>نوع الاشتراك</Label>
                <RadioGroup value={grantType} onValueChange={(v) => setGrantType(v as any)}>
                  <div
                    className={`flex items-center space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer ${
                      grantType === 'premium' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setGrantType('premium')}
                  >
                    <RadioGroupItem value="premium" id="grant-premium" />
                    <Label htmlFor="grant-premium" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Premium
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 space-x-reverse p-3 border rounded-lg cursor-pointer ${
                      grantType === 'premium_plus' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setGrantType('premium_plus')}
                  >
                    <RadioGroupItem value="premium_plus" id="grant-premium-plus" />
                    <Label htmlFor="grant-premium-plus" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      Premium Plus
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <p className="text-xs text-muted-foreground">
                * سيتم منح الاشتراك لمدة 30 يوم مجاناً
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGrantDialog(false);
                  setSelectedStudent(null);
                  setSelectedFolder(null);
                }}
                disabled={granting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleGrantSubscription}
                disabled={granting || !selectedStudent || !selectedFolder}
              >
                {granting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري المنح...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 ml-2" />
                    منح الاشتراك
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
