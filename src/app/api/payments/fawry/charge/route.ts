import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { PAYMOB_CONFIG, PayMobIntentionRequest, PayMobIntentionResponse } from '@/lib/paymob-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, folderId, amount, email, firstName, lastName, phone } = body;

    // Validate input
    if (!email || !amount || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert EGP to fils (1 EGP = 100 fils)
    const amountInFils = Math.round(amount * 100);

    const intentionData: PayMobIntentionRequest = {
      amount: amountInFils,
      currency: 'EGP',
      payment_methods: ['card', 'wallet', 'fawry'],
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
        street: '',
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
      },
      merchant_order_id: `ORDER_${studentId}_${folderId}_${Date.now()}`,
      extras: {
        studentId,
        folderId,
      },
    };

    const response = await axios.post<PayMobIntentionResponse>(
      `${PAYMOB_CONFIG.intentionApiUrl}/intention/`,
      intentionData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYMOB_PUBLIC_KEY}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      intentionId: response.data.id,
      clientSecret: response.data.client_secret,
      paymentMethods: response.data.payment_methods,
    });
  } catch (error: any) {
    console.error('PayMob Intention API Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create PayMob payment intention' },
      { status: 500 }
    );
  }
}