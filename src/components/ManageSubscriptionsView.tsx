"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, User, FolderOpen, Crown, Zap, X } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: number;
  studentId: number;
  folderId: number;
  subscriptionType: 'free' | 'premium' | 'premium_plus';
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  studentName?: string;
  folderName?: string;
}

export function ManageSubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubs(subscriptions);
    } else {
      const filtered = subscriptions.filter(
        (sub) =>
          sub.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.folderName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubs(filtered);
    }
  }, [searchQuery, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions?limit=100');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
        setFilteredSubs(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id: number) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الاشتراك؟')) return;

    try {
      const response = await fetch(`/api/subscriptions?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        toast.success('تم إلغاء الاشتراك بنجاح');
        fetchSubscriptions();
      } else {
        toast.error('فشل إلغاء الاشتراك');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إلغاء الاشتراك');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      expired: { label: 'منتهي', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
      cancelled: { label: 'ملغي', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    };
    const variant = variants[status] || variants.active;
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'premium') {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" variant="outline">
          <Crown className="w-3 h-3 ml-1" />
          Premium
        </Badge>
      );
    }
    if (type === 'premium_plus') {
      return (
        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20" variant="outline">
          <Zap className="w-3 h-3 ml-1" />
          Premium Plus
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20" variant="outline">
        مجاني
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن اشتراك (اسم الطالب أو المجلد)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredSubs.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد اشتراكات</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'لم يتم العثور على اشتراكات مطابقة' : 'لا يوجد اشتراكات حالياً'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubs.map((sub) => (
            <Card key={sub.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getTypeBadge(sub.subscriptionType)}
                    {getStatusBadge(sub.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">الطالب:</span>
                      <span className="font-medium text-foreground">{sub.studentName || 'غير متوفر'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">المجلد:</span>
                      <span className="font-medium text-foreground">{sub.folderName || 'غير متوفر'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">من:</span>
                      <span className="font-medium text-foreground">{formatDate(sub.startDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">إلى:</span>
                      <span className="font-medium text-foreground">{formatDate(sub.endDate)}</span>
                    </div>
                  </div>
                </div>

                {sub.status === 'active' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelSubscription(sub.id)}
                  >
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
