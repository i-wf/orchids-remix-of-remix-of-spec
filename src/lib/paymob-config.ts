import crypto from 'crypto';

export const PAYMOB_CONFIG = {
  intentionApiUrl: process.env.NEXT_PUBLIC_PAYMOB_API_URL || 'https://accept.paymob.com/api',
  checkoutUrl: process.env.NEXT_PUBLIC_PAYMOB_CHECKOUT_URL || 'https://accept.paymob.com/checkout',
};

export interface PayMobIntentionRequest {
  amount: number; // Amount in fils (1 EGP = 100 fils)
  currency: string;
  payment_methods: string[];
  items?: {
    name: string;
    description?: string;
    amount: number;
    quantity: number;
  }[];
  billing_data?: {
    apartment: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    floor: string;
    building: string;
    street: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  merchant_order_id?: string;
  extras?: Record<string, any>;
}

export interface PayMobIntentionResponse {
  id: string;
  client_secret: string;
  public_key?: string;
  payment_methods: string[];
  amount: number;
  currency: string;
  created_at: string;
  status: string;
}

export interface PayMobWebhook {
  type: string;
  data: {
    id: string;
    status: string;
    amount_cents: number;
    currency: string;
    merchant_order_id?: string;
    intention_id?: string;
    payment_method: string;
    order: {
      id: string;
      amount_cents: number;
    };
    success: boolean;
  };
}

export function generatePayMobSignature(
  payload: Record<string, any>,
  secretKey: string
): string {
  const message = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
  return signature;
}
