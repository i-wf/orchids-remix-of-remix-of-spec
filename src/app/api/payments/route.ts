import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Helper function to get Arabic status translation
function getStatusArabic(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'paid': 'مدفوع',
    'failed': 'فشل',
    'expired': 'منتهي الصلاحية',
    'cancelled': 'ملغي'
  };
  return statusMap[status] || status;
}

// Helper function to convert piastres to EGP
function convertToEGP(amount: number): number {
  return amount / 100;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, fetch single payment
    if (id) {
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const paymentId = parseInt(id);

      // Fetch single payment
      const paymentRecord = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (paymentRecord.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const payment = paymentRecord[0];

      // Enhance response with additional fields
      const enhancedPayment = {
        ...payment,
        amountEGP: convertToEGP(payment.amount),
        statusArabic: getStatusArabic(payment.status)
      };

      return NextResponse.json({ payment: enhancedPayment }, { status: 200 });
    }

    // List payments with filters
    const userId = searchParams.get('userId');
    const folderId = searchParams.get('folderId');
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate userId if provided
    if (userId && isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate folderId if provided
    if (folderId && isNaN(parseInt(folderId))) {
      return NextResponse.json(
        { error: 'folderId must be a valid integer', code: 'INVALID_FOLDER_ID' },
        { status: 400 }
      );
    }

    // Validate provider if provided
    if (provider && !['paymob', 'fawry'].includes(provider)) {
      return NextResponse.json(
        { error: 'provider must be either "paymob" or "fawry"', code: 'INVALID_PROVIDER' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['pending', 'paid', 'failed', 'expired', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(limitParam ?? '10'), 100);
    const offset = parseInt(offsetParam ?? '0');

    // Build where conditions
    const conditions = [];
    if (userId) {
      conditions.push(eq(payments.userId, parseInt(userId)));
    }
    if (folderId) {
      conditions.push(eq(payments.folderId, parseInt(folderId)));
    }
    if (provider) {
      conditions.push(eq(payments.provider, provider));
    }
    if (status) {
      conditions.push(eq(payments.status, status));
    }

    // Build query
    let query = db.select().from(payments);

    // Apply filters if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(payments);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: total }] = await countQuery;

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    // Enhance results (exclude metadata, add amountEGP and statusArabic)
    const enhancedResults = results.map(payment => {
      const { metadata, ...paymentWithoutMetadata } = payment;
      return {
        ...paymentWithoutMetadata,
        amountEGP: convertToEGP(payment.amount),
        statusArabic: getStatusArabic(payment.status)
      };
    });

    return NextResponse.json(
      {
        payments: enhancedResults,
        total,
        limit,
        offset
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}