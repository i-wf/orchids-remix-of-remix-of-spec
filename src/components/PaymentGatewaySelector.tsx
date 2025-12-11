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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">رقم الدفع Fawry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent/20 p-6 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">رقم المرجع</p>
            <p className="text-3xl font-bold font-mono text-primary">{fawryReference}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium">المبلغ المطلوب: <span className="text-primary">{amount} جنيه</span></p>
            <p className="text-muted-foreground">
              قم بزيارة أقرب فرع Fawry أو استخدم تطبيق Fawry لإتمام الدفع باستخدام هذا الرقم
            </p>
          </div>

          <Button onClick={() => window.print()} className="w-full">
            طباعة رقم الدفع
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>اختر طريقة الدفع</CardTitle>
        <CardDescription>
          المبلغ المطلوب: {amount} جنيه مصري
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gateway Selection */}
          <div className="space-y-3">
            <Label>بوابة الدفع</Label>
            <RadioGroup value={gateway} onValueChange={(v) => setGateway(v as any)}>
              <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="paymob" id="paymob" />
                <Label htmlFor="paymob" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="font-medium">PayMob</p>
                      <p className="text-xs text-muted-foreground">بطاقات ائتمانية، محافظ إلكترونية، Fawry</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="fawry" id="fawry" />
                <Label htmlFor="fawry" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Fawry</p>
                      <p className="text-xs text-muted-foreground">الدفع في فروع Fawry أو بطاقات ائتمانية</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method (Fawry only) */}
          {gateway === 'fawry' && (
            <div className="space-y-3">
              <Label>طريقة الدفع</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="fawry_cash" id="fawry_cash" />
                  <Label htmlFor="fawry_cash" className="flex-1 cursor-pointer">
                    الدفع نقداً في فروع Fawry
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse border rounded-lg p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    بطاقة ائتمانية (3D Secure)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">الاسم الأخير</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="201234567890"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              أدخل الرقم بالصيغة: 201234567890
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
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
