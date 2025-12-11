import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { FAWRY_ENDPOINTS, fawryConfig, generateFawrySignature } from '@/lib/fawry-config';

interface StatusResponse {
  statusCode: number;
  statusDescription: string;
  paymentStatus?: string;
  fawryRefNumber?: string;
  amount?: number;
  paymentMethod?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantRefNum } = body;

    if (!merchantRefNum) {
      return NextResponse.json(
        { error: 'merchantRefNum is required' },
        { status: 400 }
      );
    }

    const signature = generateFawrySignature(
      fawryConfig.merchantCode,
      merchantRefNum,
      fawryConfig.secureKey
    );

    const endpoint = FAWRY_ENDPOINTS[fawryConfig.environment].status;

    const response = await axios.get<StatusResponse>(endpoint, {
      params: {
        merchantCode: fawryConfig.merchantCode,
        merchantRefNumber: merchantRefNum,
        signature,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Fawry status check error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}