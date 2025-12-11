"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Crown, Zap, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: number;
  name: string;
  phone: string;
  grade: string;
  premiumType: 'free' | 'premium' | 'premium_plus';
}

export function ManagePremiumView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.phone.includes(searchQuery)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users?role=student&limit=500');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        setFilteredStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePremium = async (studentId: number, premiumType: 'premium' | 'premium_plus') => {
    setActionLoading(studentId);
    try {
      const response = await fetch(`/api/users?id=${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumType }),
      });

      if (response.ok) {
        // Send notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            type: 'premium_upgrade',
            title: `تم ترقيتك إلى ${premiumType === 'premium' ? 'Premium' : 'Premium Plus'}!`,
            message: `مبروك! لديك الآن حساب ${premiumType === 'premium' ? 'Premium' : 'Premium Plus'} مع جميع المميزات.`,
          }),
        });

        toast.success('تم ترقية الحساب بنجاح');
        fetchStudents();
      } else {
        toast.error('فشل ترقية الحساب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء ترقية الحساب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDowngrade = async (studentId: number) => {
    if (!confirm('هل أنت متأكد من إلغاء الحساب المميز؟')) return;

    setActionLoading(studentId);
    try {
      const response = await fetch(`/api/users?id=${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumType: 'free' }),
      });

      if (response.ok) {
        toast.success('تم إلغاء الحساب المميز');
        fetchStudents();
      } else {
        toast.error('فشل إلغاء الحساب المميز');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إلغاء الحساب المميز');
    } finally {
      setActionLoading(null);
    }
  };

  const getPremiumBadge = (type: string) => {
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن طالب (الاسم أو رقم الهاتف)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلاب</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'لم يتم العثور على طلاب مطابقين' : 'لا يوجد طلاب مسجلين'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                      {getPremiumBadge(student.premiumType || 'free')}
                    </div>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {student.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(!student.premiumType || student.premiumType === 'free') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpgradePremium(student.id, 'premium')}
                        disabled={actionLoading === student.id}
                      >
                        {actionLoading === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Crown className="w-4 h-4 ml-2" />
                            Premium
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpgradePremium(student.id, 'premium_plus')}
                        disabled={actionLoading === student.id}
                      >
                        {actionLoading === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 ml-2" />
                            Premium Plus
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {student.premiumType === 'premium' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpgradePremium(student.id, 'premium_plus')}
                        disabled={actionLoading === student.id}
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        ترقية لـ Plus
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDowngrade(student.id)}
                        disabled={actionLoading === student.id}
                      >
                        إلغاء
                      </Button>
                    </>
                  )}
                  {student.premiumType === 'premium_plus' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDowngrade(student.id)}
                      disabled={actionLoading === student.id}
                    >
                      إلغاء Premium
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
