import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { db } from '@/db';
import { payments, users, lessonFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, folderId, amount, firstName, lastName, email, phone, subscriptionType, paymentMethod } = body;

    // Validate required fields
    if (!userId || !folderId || !amount || !firstName || !lastName || !email || !phone || !subscriptionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate userId is integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer' },
        { status: 400 }
      );
    }

    // Validate folderId is integer
    if (isNaN(parseInt(folderId))) {
      return NextResponse.json(
        { error: 'folderId must be a valid integer' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate subscriptionType
    if (!['premium', 'premium_plus'].includes(subscriptionType)) {
      return NextResponse.json(
        { error: 'subscriptionType must be either "premium" or "premium_plus"' },
        { status: 400 }
      );
    }

    // Validate user exists and is a student
    const user = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    if (user[0].role !== 'student') {
      return NextResponse.json(
        { error: 'User must be a student' },
        { status: 400 }
      );
    }

    // Validate folder exists
    const folder = await db.select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(folderId)))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json(
        { error: 'Lesson folder not found' },
        { status: 400 }
      );
    }

    // Generate unique merchantOrderId
    const randomString = crypto.randomBytes(3).toString('hex');
    const merchantOrderId = `PAYMOB_${userId}_${folderId}_${Date.now()}_${randomString}`;

    // Convert amount to piastres (cents)
    const amountInPiastres = parseInt(amount) * 100;

    // Get PayMob public key from environment
    const paymobPublicKey = process.env.PAYMOB_PUBLIC_KEY;
    if (!paymobPublicKey) {
      console.error('PAYMOB_PUBLIC_KEY is not set');
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    // Prepare PayMob request payload
    const paymobPayload = {
      amount: amountInPiastres,
      currency: 'EGP',
      payment_methods: [paymentMethod || 'CARD'],
      billing_data: {
        apartment: '',
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        email: email,
        city: 'Cairo',
        state: 'Cairo',
        country: 'EG',
        postal_code: '11111',
        floor: '',
        building: '',
        street: ''
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone
      },
      merchant_order_id: merchantOrderId,
      extras: {
        userId,
        folderId
      }
    };

    // Call PayMob Intention API
    const paymobResponse = await axios.post(
      'https://accept.paymob.com/v1/intention/',
      paymobPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paymobPublicKey}`
        }
      }
    );

    console.log('PayMob API Response:', paymobResponse.data);

    // Create payment record in database
    const now = new Date().toISOString();
    const newPayment = await db.insert(payments)
      .values({
        userId: parseInt(userId),
        folderId: parseInt(folderId),
        merchantOrderId,
        provider: 'paymob',
        providerReferenceNumber: paymobResponse.data.id,
        amount: amountInPiastres,
        currency: 'EGP',
        paymentMethod: paymentMethod || 'CARD',
        status: 'pending',
        webhookReceived: false,
        subscriptionType,
        metadata: JSON.stringify(paymobResponse.data),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        merchantOrderId,
        intentionId: paymobResponse.data.id,
        clientSecret: paymobResponse.data.client_secret,
        redirectUrl: paymobResponse.data.redirect_url || '',
        payment: {
          id: newPayment[0].id,
          merchantOrderId: newPayment[0].merchantOrderId,
          status: newPayment[0].status,
          amount: newPayment[0].amount,
          createdAt: newPayment[0].createdAt
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('PayMob create-intention error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create payment intention: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}