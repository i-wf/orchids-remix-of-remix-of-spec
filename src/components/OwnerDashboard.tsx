"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Key, Copy, CheckCircle2, XCircle, Loader2, Users, GraduationCap, BookOpen, Trash2, Edit, CreditCard, Crown, Lock, Building2, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OwnerPaymentRequests } from './OwnerPaymentRequests';
import { OwnerSubscriptionsManager } from './OwnerSubscriptionsManager';
import { toast } from 'sonner';

interface AccessCode {
  id: number;
  code: string;
  teacherName: string;
  used: boolean;
  usedByUserId: number | null;
  createdAt: string;
}

interface CenterCode {
  id: number;
  code: string;
  centerName: string;
  used: boolean;
  usedByUserId: number | null;
  createdAt: string;
}

interface SecretaryCode {
  id: number;
  code: string;
  secretaryName: string;
  teacherId: number;
  used: boolean;
  usedByUserId: number | null;
  createdAt: string;
}

interface User {
  id: number;
  phone: string;
  role: string;
  grade: string | null;
  name: string;
  centerName: string | null;
  teacherId: number | null;
  createdAt: string;
}

const GRADES = [
  { value: '4-primary', label: 'الصف الرابع الابتدائي' },
  { value: '5-primary', label: 'الصف الخامس الابتدائي' },
  { value: '6-primary', label: 'الصف السادس الابتدائي' },
  { value: '1-preparatory', label: 'الصف الأول الإعدادي' },
  { value: '2-preparatory', label: 'الصف الثاني الإعدادي' },
  { value: '3-preparatory', label: 'الصف الثالث الإعدادي' },
  { value: '1-secondary', label: 'الصف الأول الثانوي' },
  { value: '2-secondary', label: 'الصف الثاني الثانوي' },
  { value: '3-secondary', label: 'الصف الثالث الثانوي' },
];

export function OwnerDashboard() {
  const { user, logout } = useAuth();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [centerCodes, setCenterCodes] = useState<CenterCode[]>([]);
  const [secretaryCodes, setSecretaryCodes] = useState<SecretaryCode[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [centerCodeInput, setCenterCodeInput] = useState('');
  const [centerNameInput, setCenterNameInput] = useState('');
  const [secretaryCodeInput, setSecretaryCodeInput] = useState('');
  const [secretaryNameInput, setSecretaryNameInput] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('codes');
  
  // New state for unified code generation
  const [codePurpose, setCodePurpose] = useState<'teacher' | 'center'>('teacher');
  const [entityName, setEntityName] = useState('');
  
  // Users management state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [secretaries, setSecretaries] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  // Add password change states
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchAccessCodes();
    fetchCenterCodes();
    fetchSecretaryCodes();
    fetchAllUsers();
  }, []);

  const fetchAccessCodes = async () => {
    try {
      const response = await fetch('/api/teacher-access-codes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setAccessCodes(data);
      }
    } catch (error) {
      console.error('Error fetching access codes:', error);
    }
  };

  const fetchCenterCodes = async () => {
    try {
      const response = await fetch('/api/center-access-codes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setCenterCodes(data);
      }
    } catch (error) {
      console.error('Error fetching center codes:', error);
    }
  };

  const fetchSecretaryCodes = async () => {
    try {
      const response = await fetch('/api/secretary-access-codes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setSecretaryCodes(data);
      }
    } catch (error) {
      console.error('Error fetching secretary codes:', error);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        setStudents(data.filter((u: User) => u.role === 'student'));
        setTeachers(data.filter((u: User) => u.role === 'teacher'));
        setSecretaries(data.filter((u: User) => u.role === 'secretary'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateRandomCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const generatedCode = generateRandomCode();

    try {
      if (codePurpose === 'teacher') {
        const response = await fetch('/api/teacher-access-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: generatedCode,
            teacherName: entityName,
            createdByOwnerId: user?.id,
          }),
        });

        if (response.ok) {
          setEntityName('');
          fetchAccessCodes();
          toast.success(`تم إنشاء كود المعلم: ${generatedCode}`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'فشل إنشاء الكود');
        }
      } else {
        const response = await fetch('/api/center-access-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: generatedCode,
            centerName: entityName,
            createdByOwnerId: user?.id,
          }),
        });

        if (response.ok) {
          setEntityName('');
          fetchCenterCodes();
          toast.success(`تم إنشاء كود السنتر: ${generatedCode}`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'فشل إنشاء الكود');
        }
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCenterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/center-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: centerCodeInput.toUpperCase(),
          centerName: centerNameInput,
          createdByOwnerId: user?.id,
        }),
      });

      if (response.ok) {
        setCenterCodeInput('');
        setCenterNameInput('');
        fetchCenterCodes();
        toast.success('تم إنشاء كود السنتر بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecretaryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      toast.error('يرجى اختيار المعلم');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/secretary-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: secretaryCodeInput.toUpperCase(),
          secretaryName: secretaryNameInput,
          teacherId: parseInt(selectedTeacherId),
        }),
      });

      if (response.ok) {
        setSecretaryCodeInput('');
        setSecretaryNameInput('');
        setSelectedTeacherId('');
        fetchSecretaryCodes();
        toast.success('تم إنشاء كود السكرتير بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل إنشاء الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (codeText: string, id: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;

    try {
      const response = await fetch(`/api/teacher-access-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAccessCodes();
      } else {
        const error = await response.json();
        alert(error.error || 'فشل حذف الكود');
      }
    } catch (error) {
      alert('حدث خطأ أثناء حذف الكود');
    }
  };

  const handleDeleteCenterCode = async (id: number) => {
    try {
      const response = await fetch(`/api/center-access-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCenterCodes();
        toast.success('تم حذف الكود بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل حذف الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود');
    }
  };

  const handleDeleteSecretaryCode = async (id: number) => {
    try {
      const response = await fetch(`/api/secretary-access-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSecretaryCodes();
        toast.success('تم حذف الكود بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل حذف الكود');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الكود');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته بشكل نهائي.')) return;

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAllUsers();
        alert('تم حذف المستخدم بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || 'فشل حذف المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ أثناء حذف المستخدم');
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditName(userToEdit.name);
    setEditGrade(userToEdit.grade || '');
    setEditPhone(userToEdit.phone);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users?id=${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          grade: editGrade || null,
          phone: editPhone,
        }),
      });

      if (response.ok) {
        setEditingUser(null);
        fetchAllUsers();
        alert('تم تحديث بيانات المستخدم بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || 'فشل تحديث المستخدم');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تحديث المستخدم');
    }
  };

  const handleChangeUserPassword = async () => {
    if (!changingPasswordUser) return;

    if (!newPassword || !confirmNewPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: changingPasswordUser.id,
          newPassword,
          ownerId: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setChangingPasswordUser(null);
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل تغيير كلمة المرور');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  const getGradeLabel = (grade: string | null) => {
    if (!grade) return '-';
    const gradeObj = GRADES.find(g => g.value === grade);
    return gradeObj ? gradeObj.label : grade;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: 'طالب',
      teacher: 'معلم',
      owner: 'مالك',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{user?.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">مالك المنصة</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 ml-2" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-sm text-muted-foreground">طالب</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{teachers.length}</p>
                <p className="text-sm text-muted-foreground">معلم</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Key className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{accessCodes.length}</p>
                <p className="text-sm text-muted-foreground">كود وصول</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="codes" className="text-xs sm:text-sm">
              <Key className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">الأكواد</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">الطلاب</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="text-xs sm:text-sm">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">المعلمين</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">المدفوعات</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">الاشتراكات</span>
            </TabsTrigger>
          </TabsList>

          {/* Access Codes Tab */}
          <TabsContent value="codes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Code Form */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">إنشاء كود وصول جديد</h2>
                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codePurpose">نوع الكود</Label>
                    <Select value={codePurpose} onValueChange={(v) => setCodePurpose(v as 'teacher' | 'center')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">معلم (Teacher)</SelectItem>
                        <SelectItem value="center">سنتر (Center)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {codePurpose === 'teacher' ? 'الكود للمعلمين' : 'الكود للسنترات'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entityName">
                      {codePurpose === 'teacher' ? 'اسم المعلم' : 'اسم السنتر'}
                    </Label>
                    <Input
                      id="entityName"
                      type="text"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder={codePurpose === 'teacher' ? 'أحمد محمد' : 'سنتر النور'}
                      required
                      disabled={loading}
                      className="text-right"
                    />
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      ⚡ سيتم توليد كود عشوائي تلقائياً (8 أحرف)
                    </p>
                  </div>

                  <Button type="submit" className="w-full transition-all hover:scale-105" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جارٍ الإنشاء...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 ml-2" />
                        إنشاء كود
                      </>
                    )}
                  </Button>
                </form>
              </Card>

              {/* Access Codes List */}
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">أكواد الوصول</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-primary mb-2">أكواد المعلمين ({accessCodes.length})</h3>
                    {accessCodes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد أكواد معلمين</p>
                    ) : (
                      <div className="space-y-2">
                        {accessCodes.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border transition-all hover:border-primary/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-xs sm:text-sm font-mono font-bold text-primary truncate">{item.code}</code>
                                {item.used ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.teacherName}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.used ? 'مستخدم ✅' : 'غير مستخدم ⏳'}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(item.code, item.id)}
                              >
                                {copiedId === item.id ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              {!item.used && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteCode(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <h3 className="text-sm font-semibold text-green-500 mb-2">أكواد السنترات ({centerCodes.length})</h3>
                    {centerCodes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد أكواد سنترات</p>
                    ) : (
                      <div className="space-y-2">
                        {centerCodes.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20 transition-all hover:border-green-500/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <code className="text-xs sm:text-sm font-mono font-bold text-green-500 truncate">{item.code}</code>
                                {item.used ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.centerName}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.used ? 'مستخدم ✅' : 'غير مستخدم ⏳'}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(item.code, item.id)}
                              >
                                {copiedId === item.id ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              {!item.used && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteCenterCode(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">إدارة الطلاب ({students.length})</h2>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا يوجد طلاب</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-secondary rounded-lg border border-border transition-all hover:border-primary/50 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-primary flex-shrink-0" />
                          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{student.name}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground" dir="ltr">{student.phone}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{getGradeLabel(student.grade)}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(student)}
                          className="flex-1 sm:flex-none"
                        >
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setChangingPasswordUser(student);
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Lock className="w-4 h-4 ml-2" />
                          كلمة المرور
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(student.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">إدارة المعلمين ({teachers.length})</h2>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا يوجد معلمين</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-secondary rounded-lg border border-border transition-all hover:border-primary/50 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{teacher.name}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground" dir="ltr">{teacher.phone}</p>
                        <p className="text-xs text-muted-foreground">انضم: {new Date(teacher.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(teacher)}
                          className="flex-1 sm:flex-none"
                        >
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setChangingPasswordUser(teacher);
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Lock className="w-4 h-4 ml-2" />
                          كلمة المرور
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(teacher.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">إدارة طلبات الدفع</h2>
              <OwnerPaymentRequests />
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">إدارة الاشتراكات</h2>
              <OwnerSubscriptionsManager />
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={true} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              {editingUser.role === 'student' && (
                <div className="space-y-2">
                  <Label>الصف الدراسي</Label>
                  <Select value={editGrade} onValueChange={setEditGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 transition-all hover:scale-105"
                >
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Password Dialog */}
      {changingPasswordUser && (
        <Dialog open={true} onOpenChange={() => setChangingPasswordUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تغيير كلمة المرور - {changingPasswordUser.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>تأكيد كلمة المرور</Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setChangingPasswordUser(null)}
                  className="flex-1"
                  disabled={changingPassword}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleChangeUserPassword}
                  className="flex-1 transition-all hover:scale-105"
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التغيير...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 ml-2" />
                      تغيير كلمة المرور
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}