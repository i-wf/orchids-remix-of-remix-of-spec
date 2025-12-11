import { NextRequest, NextResponse } from 'next/server';
import { validateFawryCallbackSignature, fawryConfig, FawryCallback } from '@/lib/fawry-config';
import { db } from '@/db';
import { paymentRequests, subscriptions, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const params: FawryCallback = await request.json();

    // Validate signature
    if (!validateFawryCallbackSignature(params, fawryConfig.secureKey)) {
      console.warn('Invalid Fawry callback signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract student and folder IDs from merchantRefNumber
    // Expected format: FAWRY_<studentId>_<folderId>_<timestamp>
    const refParts = params.merchantRefNumber.split('_');
    if (refParts.length < 4 || refParts[0] !== 'FAWRY') {
      return NextResponse.json({ ok: true });
    }

    const studentId = parseInt(refParts[1]);
    const folderId = parseInt(refParts[2]);

    // Handle payment success
    if (params.orderStatus === 'PAID') {
      console.log('Fawry payment successful:', params.fawryRefNumber);

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
            ownerNote: `Fawry Payment - Ref: ${params.fawryRefNumber}`,
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
          paymentMethod: 'fawry',
          monthlyPrice: request.amount,
          createdAt: new Date().toISOString(),
        });

        // Create notification
        await db.insert(notifications).values({
          studentId,
          notificationType: 'payment_approved',
          message: 'تم قبول طلب الدفع الخاص بك بنجاح عبر Fawry',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Handle payment failure or expiry
    if (params.orderStatus === 'EXPIRED' || params.orderStatus === 'CANCELLED') {
      console.log('Fawry payment failed:', params.merchantRefNumber);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Fawry callback processing error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}