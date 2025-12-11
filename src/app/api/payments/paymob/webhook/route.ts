import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { payments, subscriptions, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PayMobWebhook } from '@/lib/paymob-config';

function verifyPayMobSignature(
  payload: string,
  signature: string,
  hmacSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', hmacSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hmac-signature') || '';
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET || '';

    // Verify webhook authenticity
    if (hmacSecret && !verifyPayMobSignature(body, signature, hmacSecret)) {
      console.warn('Invalid PayMob webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhook: PayMobWebhook = JSON.parse(body);

    if (webhook.type !== 'TRANSACTION') {
      return NextResponse.json({ ok: true });
    }

    const { data } = webhook;

    // Extract student and folder IDs from merchant_order_id
    const orderIdParts = data.merchant_order_id?.split('_');
    if (!orderIdParts || orderIdParts.length < 3) {
      return NextResponse.json({ ok: true });
    }

    const studentId = parseInt(orderIdParts[1]);
    const folderId = parseInt(orderIdParts[2]);

    // Handle payment success
    if (data.success && data.status === 'SUCCESS') {
      console.log('PayMob payment successful:', data.intention_id);

      // Find the payment request
      const paymentRequest = await db
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.studentId, studentId))
        .where(eq(paymentRequests.folderId, folderId))
        .orderBy(paymentRequests.createdAt)
        .limit(1);

      if (paymentRequest.length > 0) {
        const request = paymentRequest[0];

        // Update payment request status
        await db
          .update(paymentRequests)
          .set({
            status: 'approved',
            ownerNote: `PayMob Payment - Transaction ID: ${data.id}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(paymentRequests.id, request.id));

        // Create subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await db.insert(subscriptions).values({
          studentId,
          folderId,
          subscriptionType: request.subscriptionType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          paymentMethod: 'paymob',
          monthlyPrice: request.amount,
          createdAt: new Date().toISOString(),
        });

        // Create notification
        await db.insert(notifications).values({
          studentId,
          notificationType: 'payment_approved',
          message: 'تم قبول طلب الدفع الخاص بك بنجاح عبر PayMob',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Handle payment failure
    if (!data.success || data.status === 'FAILED') {
      console.log('PayMob payment failed:', data.intention_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PayMob webhook processing error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}