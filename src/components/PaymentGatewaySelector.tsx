"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Building2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentGatewaySelectorProps {
  studentId: number;
  folderId: number;
  amount: number;
  folderName: string;
  onSuccess?: () => void;
}

export function PaymentGatewaySelector({
  studentId,
  folderId,
  amount,
  folderName,
  onSuccess,
}: PaymentGatewaySelectorProps) {
  const [gateway, setGateway] = useState<'paymob' | 'fawry'>('paymob');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'fawry_cash'>('card');
  const [loading, setLoading] = useState(false);
  const [fawryReference, setFawryReference] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handlePayMobPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/paymob/create-intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          folderId,
          amount,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      
      // Redirect to PayMob checkout
      const checkoutUrl = `${process.env.NEXT_PUBLIC_PAYMOB_CHECKOUT_URL}?intention_id=${data.intentionId}&client_secret=${data.clientSecret}`;
      
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage(
          { type: 'OPEN_EXTERNAL_URL', data: { url: checkoutUrl } },
          '*'
        );
      } else {
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      }

      toast.success('تم توجيهك إلى صفحة الدفع');
      onSuccess?.();
    } catch (error) {
      console.error('PayMob payment error:', error);
      toast.error('فشل إنشاء عملية الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleFawryPayment = async () => {
    setLoading(true);
    try {
      const merchantRefNum = `FAWRY_${studentId}_${folderId}_${Date.now()}`;
      const method = paymentMethod === 'card' ? 'CARD' : 'PAYATFAWRY';

      const response = await fetch('/api/payments/fawry/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          merchantRefNum,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerMobile: formData.phone,
          paymentMethod: method,
          itemDescription: `اشتراك في ${folderName}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const data = await response.json();

      if (method === 'CARD' && data.returnURL) {
        // Redirect to 3DS page
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          window.parent.postMessage(
            { type: 'OPEN_EXTERNAL_URL', data: { url: data.returnURL } },
            '*'
          );
        } else {
          window.open(data.returnURL, '_blank', 'noopener,noreferrer');
        }
        toast.success('تم توجيهك إلى صفحة الدفع');
      } else if (method === 'PAYATFAWRY') {
        // Show Fawry reference number
        setFawryReference(data.fawryRefNumber);
        toast.success('تم إنشاء رقم الدفع بنجاح');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Fawry payment error:', error);
      toast.error(error.message || 'فشل إنشاء عملية الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (gateway === 'paymob') {
      await handlePayMobPayment();
    } else {
      await handleFawryPayment();
    }
  };

  if (fawryReference) {
    return (
      <Card className="w-full rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-center text-base sm:text-lg">رقم الدفع Fawry</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="bg-accent/20 p-4 sm:p-6 rounded-xl text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">رقم المرجع</p>
            <p className="text-xl sm:text-3xl font-bold font-mono text-primary break-all">{fawryReference}</p>
          </div>
          
          <div className="space-y-2 text-xs sm:text-sm">
            <p className="font-medium">المبلغ المطلوب: <span className="text-primary">{amount} جنيه</span></p>
            <p className="text-muted-foreground">
              قم بزيارة أقرب فرع Fawry أو استخدم تطبيق Fawry لإتمام الدفع باستخدام هذا الرقم
            </p>
          </div>

          <Button onClick={() => window.print()} className="w-full rounded-xl">
            طباعة رقم الدفع
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">اختر طريقة الدفع</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          المبلغ المطلوب: {amount} جنيه مصري
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Gateway Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm">بوابة الدفع</Label>
            <RadioGroup value={gateway} onValueChange={(v) => setGateway(v as any)}>
              <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-2.5 sm:p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="paymob" id="paymob" />
                <Label htmlFor="paymob" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">PayMob</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">بطاقات ائتمانية، محافظ إلكترونية</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-2.5 sm:p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="fawry" id="fawry" />
                <Label htmlFor="fawry" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Fawry</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">الدفع في فروع Fawry</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method (Fawry only) */}
          {gateway === 'fawry' && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm">طريقة الدفع</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-2.5 sm:p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="fawry_cash" id="fawry_cash" />
                  <Label htmlFor="fawry_cash" className="flex-1 cursor-pointer text-xs sm:text-sm">
                    الدفع نقداً في فروع Fawry
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-2.5 sm:p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer text-xs sm:text-sm">
                    بطاقة ائتمانية (3D Secure)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="firstName" className="text-xs sm:text-sm">الاسم الأول</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="lastName" className="text-xs sm:text-sm">الاسم الأخير</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="phone" className="text-xs sm:text-sm">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="201234567890"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              أدخل الرقم بالصيغة: 201234567890
            </p>
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              `ادفع ${amount} جنيه`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}