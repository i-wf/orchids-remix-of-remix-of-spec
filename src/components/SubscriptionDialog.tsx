"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Crown, Zap, Upload, MessageCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  folderName: string;
  studentId: number;
  onSubscriptionSuccess: () => void;
}

export function SubscriptionDialog({
  isOpen,
  onClose,
  folderId,
  folderName,
  studentId,
  onSubscriptionSuccess,
}: SubscriptionDialogProps) {
  const [subscriptionType, setSubscriptionType] = useState<'premium' | 'premium_plus'>('premium');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'fawry' | 'instapay'>('vodafone_cash');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prices = {
    premium: 100,
    premium_plus: 150,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `مرحباً، أريد الاشتراك في المجلد: ${folderName}\nنوع الاشتراك: ${subscriptionType === 'premium' ? 'Premium' : 'Premium Plus'}\nالسعر: ${prices[subscriptionType]} جنيه\nID الطالب: ${studentId}`
    );
    window.open(`https://wa.me/201234567890?text=${message}`, '_blank');
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error('يرجى رفع صورة إيصال الدفع');
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', screenshot);
      uploadFormData.append('folder', 'payment-screenshots');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('فشل رفع الصورة');
      }

      const uploadData = await uploadResponse.json();
      const screenshotUrl = uploadData.url;

      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          folderId,
          subscriptionType,
          paymentMethod,
          amount: prices[subscriptionType],
          screenshotUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit payment request');
      }

      toast.success('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعته قريباً');
      onClose();
      onSubscriptionSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl">اشترك في {folderName}</DialogTitle>
          <DialogDescription className="text-right">
            اختر خطة الاشتراك المناسبة لك
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subscription Plans */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">خطط الاشتراك</Label>
            <RadioGroup value={subscriptionType} onValueChange={(v) => setSubscriptionType(v as any)}>
              {/* Premium Plan */}
              <div
                className={`relative flex items-start space-x-3 space-x-reverse p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  subscriptionType === 'premium' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setSubscriptionType('premium')}
              >
                <RadioGroupItem value="premium" id="premium" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <Label htmlFor="premium" className="text-lg font-bold cursor-pointer">
                      Premium
                    </Label>
                    <span className="text-sm text-muted-foreground">- {prices.premium} جنيه/شهرياً</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      الوصول لجميع الدروس في المجلد
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      ملخصات AI
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      بطاقات تعليمية
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      استخدام محدود للذكاء الاصطناعي (10 طلبات/يوم)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Premium Plus Plan */}
              <div
                className={`relative flex items-start space-x-3 space-x-reverse p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  subscriptionType === 'premium_plus' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => setSubscriptionType('premium_plus')}
              >
                <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-bold">
                  الأفضل
                </div>
                <RadioGroupItem value="premium_plus" id="premium_plus" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <Label htmlFor="premium_plus" className="text-lg font-bold cursor-pointer">
                      Premium Plus
                    </Label>
                    <span className="text-sm text-muted-foreground">- {prices.premium_plus} جنيه/شهرياً</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      كل مميزات Premium
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <strong>استخدام غير محدود للذكاء الاصطناعي</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      أولوية في الدعم الفني
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      تحليلات متقدمة لأدائك
                    </li>
                  </ul>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">طريقة الدفع</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg">
                <RadioGroupItem value="vodafone_cash" id="vodafone" />
                <Label htmlFor="vodafone" className="flex-1 cursor-pointer">
                  فودافون كاش
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg">
                <RadioGroupItem value="instapay" id="instapay" />
                <Label htmlFor="instapay" className="flex-1 cursor-pointer">
                  انستا باي
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg">
                <RadioGroupItem value="fawry" id="fawry" />
                <Label htmlFor="fawry" className="flex-1 cursor-pointer">
                  فوري
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">معلومات الدفع:</p>
            {paymentMethod === 'vodafone_cash' && (
              <p className="text-sm text-muted-foreground">
                رقم المحفظة: <strong>01234567890</strong>
              </p>
            )}
            {paymentMethod === 'instapay' && (
              <p className="text-sm text-muted-foreground">
                اسم المستخدم: <strong>@username</strong>
              </p>
            )}
            {paymentMethod === 'fawry' && (
              <p className="text-sm text-muted-foreground">
                كود فوري: <strong>12345</strong>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              المبلغ المطلوب: <strong>{prices[subscriptionType]} جنيه</strong>
            </p>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">صورة إيصال الدفع</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {screenshotPreview ? (
                <div className="space-y-3">
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview(null);
                    }}
                  >
                    تغيير الصورة
                  </Button>
                </div>
              ) : (
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    اضغط لرفع صورة الإيصال
                  </p>
                  <Input
                    id="screenshot-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !screenshot}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال طلب الاشتراك'
              )}
            </Button>
            <Button
              onClick={handleWhatsAppContact}
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل معنا (واتساب)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            سيتم مراجعة طلبك خلال 24 ساعة
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}