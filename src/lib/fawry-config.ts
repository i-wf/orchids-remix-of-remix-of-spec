import crypto from 'crypto';

export const FAWRY_ENDPOINTS = {
  sandbox: {
    charge: 'https://atfawry.fawrystaging.com/ECommerceWeb/Charge.aspx',
    status: 'https://atfawry.fawrystaging.com/ECommerceWeb/GetPaymentStatus',
    refund: 'https://atfawry.fawrystaging.com/ECommerceWeb/ReversalTransaction',
  },
  production: {
    charge: 'https://www.atfawry.com/ECommerceWeb/Charge.aspx',
    status: 'https://www.atfawry.com/ECommerceWeb/GetPaymentStatus',
    refund: 'https://www.atfawry.com/ECommerceWeb/ReversalTransaction',
  },
};

export const fawryConfig = {
  merchantCode: process.env.FAWRY_MERCHANT_CODE || '',
  secureKey: process.env.FAWRY_SECURE_KEY || '',
  environment: (process.env.FAWRY_ENV || 'sandbox') as 'sandbox' | 'production',
};

// Generate SHA-256 signature
export const generateFawrySignature = (
  merchantCode: string,
  merchantRefNum: string,
  secureKey: string,
  amount?: string
): string => {
  const data = amount 
    ? `${merchantCode}${merchantRefNum}${secureKey}${amount}`
    : `${merchantCode}${merchantRefNum}${secureKey}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Validate callback signature
export const validateFawryCallbackSignature = (
  params: Record<string, any>,
  secureKey: string
): boolean => {
  const { messageSignature, merchantRefNumber, fawryRefNumber } = params;
  const data = `${merchantRefNumber}${fawryRefNumber}${secureKey}`;
  const calculatedSignature = crypto.createHash('sha256').update(data).digest('hex');
  return messageSignature === calculatedSignature;
};

export interface FawryChargeRequest {
  amount: number;
  merchantRefNum: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  paymentMethod: 'CARD' | 'PAYATFAWRY' | 'INSTALLMENT';
  cardToken?: string;
  itemDescription?: string;
}

export interface FawryChargeResponse {
  type: 'error' | 'success';
  statusCode: number;
  statusDescription: string;
  chargeResponse?: {
    statusCode: number;
    statusDescription: string;
    fawryRefNumber: string;
    merchantRefNumber: string;
    returnURL?: string;
    cardToken?: string;
  };
}

export interface FawryCallback {
  requestId: string;
  fawryRefNumber: string;
  merchantRefNumber: string;
  customerMobile: string;
  customerMail: string;
  paymentAmount: number;
  orderAmount: number;
  fawryFees: number;
  shippingFees?: number;
  orderStatus: string; // NEW, PAID, EXPIRED, CANCELLED
  paymentMethod: string;
  messageSignature: string;
  orderExpiryDate: number;
}
