"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Eye, Clock, Crown, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PaymentRequest {
  id: number;
  studentId: number;
  folderId: number;
  subscriptionType: string;
  paymentMethod: string;
  amount: number;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  ownerNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: number;
  name: string;
  phone: string;
  grade: string;
}

interface Folder {
  id: number;
  name: string;
  grade: string;
}

export function OwnerPaymentRequests() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [students, setStudents] = useState<Record<number, Student>>({});
  const [folders, setFolders] = useState<Record<number, Folder>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [ownerNote, setOwnerNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/payment-requests?limit=100'
        : `/api/payment-requests?status=${filter}&limit=100`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);

        // Fetch related data
        const studentIds = [...new Set(data.map((r: PaymentRequest) => r.studentId))];
        const folderIds = [...new Set(data.map((r: PaymentRequest) => r.folderId))];

        await Promise.all([
          fetchStudents(studentIds),
          fetchFolders(folderIds),
        ]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (ids: number[]) => {
    const studentsData: Record<number, Student> = {};
    await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/users?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          studentsData[id] = data;
        }
      })
    );
    setStudents(studentsData);
  };

  const fetchFolders = async (ids: number[]) => {
    const foldersData: Record<number, Folder> = {};
    await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/lesson-folders?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          foldersData[id] = data;
        }
      })
    );
    setFolders(foldersData);
  };

  const handleApprove = async (request: PaymentRequest) => {
    setProcessing(true);
    try {
      // Update payment request status
      const updateResponse = await fetch(`/api/payment-requests?id=${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          ownerNote: ownerNote || null,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update request');

      // Create subscription for student
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: request.studentId,
          folderId: request.folderId,
          subscriptionType: request.subscriptionType,
          startDate,
          endDate,
          isActive: true,
          paymentMethod: request.paymentMethod,
          paymentScreenshotUrl: request.screenshotUrl,
          monthlyPrice: request.amount,
        }),
      });

      if (!subscriptionResponse.ok) throw new Error('Failed to create subscription');

      // Create notification for student
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: request.studentId,
          notificationType: 'payment_approved',
          message: `تم قبول طلب الاشتراك في ${folders[request.folderId]?.name}! يمكنك الآن الوصول لجميع الدروس.`,
        }),
      });

      toast.success('تم قبول الطلب وتفعيل الاشتراك!');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: PaymentRequest) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/payment-requests?id=${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          ownerNote: ownerNote || 'تم رفض الطلب',
        }),
      });

      if (!response.ok) throw new Error('Failed to update request');

      toast.success('تم رفض الطلب');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      approved: 'bg-green-500/10 text-green-500 border-green-500/30',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/30',
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };

    const labels = {
      pending: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getSubscriptionBadge = (type: string) => {
    if (type === 'premium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">
        <Zap className="w-3 h-3" />
        Premium Plus
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' && 'الكل'}
            {status === 'pending' && 'قيد المراجعة'}
            {status === 'approved' && 'مقبول'}
            {status === 'rejected' && 'مرفوض'}
            {status !== 'all' && ` (${requests.filter(r => r.status === status).length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات</h3>
          <p className="text-muted-foreground">
            {filter === 'pending' ? 'لا توجد طلبات قيد المراجعة' : 'لا توجد طلبات'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const student = students[request.studentId];
            const folder = folders[request.folderId];

            return (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(request.status)}
                      {getSubscriptionBadge(request.subscriptionType)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">الطالب:</span>{' '}
                        <span className="font-medium text-foreground">
                          {student?.name || 'جاري التحميل...'}
                        </span>
                        <span className="text-muted-foreground text-xs mr-2">
                          (ID: {request.studentId})
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">المجلد:</span>{' '}
                        <span className="font-medium text-foreground">
                          {folder?.name || 'جاري التحميل...'}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">المبلغ:</span>{' '}
                        <span className="font-medium text-foreground">{request.amount} جنيه</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">طريقة الدفع:</span>{' '}
                        <span className="font-medium text-foreground">
                          {request.paymentMethod === 'vodafone_cash' && 'فودافون كاش'}
                          {request.paymentMethod === 'instapay' && 'انستا باي'}
                          {request.paymentMethod === 'fawry' && 'فوري'}
                        </span>
                      </p>
                      {request.ownerNote && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">ملاحظة:</span>{' '}
                          <span className="text-foreground">{request.ownerNote}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setOwnerNote(request.ownerNote || '');
                    }}
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    عرض
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">تفاصيل الطلب</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Screenshot */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">صورة إيصال الدفع:</p>
                <img
                  src={selectedRequest.screenshotUrl}
                  alt="Payment screenshot"
                  className="w-full rounded-lg border border-border"
                />
              </div>

              {/* Owner Note */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    ملاحظة (اختياري):
                  </label>
                  <Textarea
                    value={ownerNote}
                    onChange={(e) => setOwnerNote(e.target.value)}
                    placeholder="أضف ملاحظة للطالب..."
                    className="resize-none text-right"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {selectedRequest.status === 'pending' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRequest)}
                    disabled={processing}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'رفض'}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={processing}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'قبول وتفعيل'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  إغلاق
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
