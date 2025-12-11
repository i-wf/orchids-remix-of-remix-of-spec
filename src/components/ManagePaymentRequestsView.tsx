"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, User, FolderOpen, CreditCard, Calendar, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRequest {
  id: number;
  studentId: number;
  folderId: number;
  amount: number;
  subscriptionType: 'premium' | 'premium_plus';
  paymentMethod: 'vodafone_cash' | 'fawry' | 'instapay';
  status: 'pending' | 'approved' | 'rejected';
  screenshotUrl?: string;
  createdAt: string;
  studentName?: string;
  folderName?: string;
  studentPhone?: string;
}

export function ManagePaymentRequestsView() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      const response = await fetch('/api/payment-requests?limit=100');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: PaymentRequest) => {
    setActionLoading(request.id);
    try {
      // 1. Update payment request status
      const updateResponse = await fetch(`/api/payment-requests?id=${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update payment request');

      // 2. Create subscription
      const subResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: request.studentId,
          folderId: request.folderId,
          subscriptionType: request.subscriptionType,
          status: 'active',
        }),
      });

      if (!subResponse.ok) throw new Error('Failed to create subscription');

      // 3. Send notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: request.studentId,
          type: 'subscription_approved',
          title: 'تم تفعيل الاشتراك!',
          message: `تم الموافقة على طلب الاشتراك في ${request.folderName}. يمكنك الآن الوصول لجميع الدروس.`,
        }),
      });

      toast.success('تم الموافقة على الطلب وتفعيل الاشتراك');
      fetchPaymentRequests();
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/payment-requests?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        toast.success('تم رفض الطلب');
        fetchPaymentRequests();
      } else {
        toast.error('فشل رفض الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض الطلب');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'قيد المراجعة', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      approved: { label: 'موافق عليه', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      rejected: { label: 'مرفوض', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      vodafone_cash: 'فودافون كاش',
      fawry: 'فوري',
      instapay: 'إنستا باي',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات دفع</h3>
          <p className="text-muted-foreground">لا يوجد طلبات دفع حالياً</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(request.status)}
                    {request.subscriptionType === 'premium' ? (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" variant="outline">
                        <Crown className="w-3 h-3 ml-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20" variant="outline">
                        <Zap className="w-3 h-3 ml-1" />
                        Premium Plus
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">الطالب:</span>
                      <span className="font-medium text-foreground">{request.studentName || 'غير متوفر'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">المجلد:</span>
                      <span className="font-medium text-foreground">{request.folderName || 'غير متوفر'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">طريقة الدفع:</span>
                      <span className="font-medium text-foreground">{getPaymentMethodLabel(request.paymentMethod)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">المبلغ:</span>
                      <span className="font-bold text-foreground">{request.amount} جنيه</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm md:col-span-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">تاريخ الطلب:</span>
                      <span className="font-medium text-foreground">{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex lg:flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={actionLoading !== null}
                      className="flex-1 lg:flex-none"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 ml-2" />
                          موافقة
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading !== null}
                      className="flex-1 lg:flex-none"
                    >
                      <X className="w-4 h-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
