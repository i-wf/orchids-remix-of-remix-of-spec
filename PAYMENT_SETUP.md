# 🇪🇬 Payment Gateway Integration Guide

This platform now supports **two Egyptian payment gateways**: **PayMob** and **Fawry**.

## 📋 Overview

Both payment gateways are integrated and ready to accept payments from Egyptian students:

- **PayMob**: Credit/debit cards, mobile wallets (Vodafone Cash, Etisalat Cash), Fawry
- **Fawry**: Cash payments at Fawry locations, credit/debit cards with 3D Secure

---

## 🔑 How to Get API Credentials

### PayMob Setup

1. **Register for PayMob Account**
   - Visit: https://accept.paymob.com/portal2/en/register
   - Fill in your business information
   - Wait for approval (usually 24-48 hours)

2. **Get Your API Keys**
   - Login to: https://accept.paymob.com/portal2/en/login
   - Navigate: **Settings** → **Account Info**
   - Copy the following:
     - **API Key** (PAYMOB_PUBLIC_KEY)
     - **Secret Key** (PAYMOB_SECRET_KEY)

3. **Setup Webhook**
   - Go to: **Settings** → **Webhook Settings**
   - Add webhook URL: `https://yourdomain.com/api/payments/paymob/webhook`
   - Copy the **HMAC Secret** (PAYMOB_HMAC_SECRET)

4. **Test with Sandbox**
   - Toggle to **Test Mode** in dashboard (top-left)
   - Use test card: `4111111111111111`, CVV: `123`, Expiry: `05/25`

### Fawry Setup

1. **Register for Fawry Merchant Account**
   - Visit: https://www.fawry.com/sme-registration-form/
   - Submit business registration form
   - Wait for approval (24-48 hours)

2. **Get Your Credentials**
   - Fawry team will email you:
     - **Merchant Code** (FAWRY_MERCHANT_CODE)
     - **Secure Key** (FAWRY_SECURE_KEY)
     - Sandbox test credentials

3. **Setup Webhook**
   - Contact Fawry support to register callback URL
   - Provide: `https://yourdomain.com/api/payments/fawry/callback`

4. **Test with Sandbox**
   - Use sandbox endpoints (already configured)
   - Test cards:
     - Visa: `4242 4242 4242 4242`
     - Mastercard: `5436 0310 3060 6378`

---

## ⚙️ Configuration

### 1. Update Environment Variables

Copy `.env.example` to `.env` and add your credentials:

```bash
# PayMob
PAYMOB_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYMOB_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYMOB_HMAC_SECRET=xxxxxxxxxxxxx
NEXT_PUBLIC_PAYMOB_API_URL=https://accept.paymob.com/api
NEXT_PUBLIC_PAYMOB_CHECKOUT_URL=https://accept.paymob.com/checkout

# Fawry
FAWRY_MERCHANT_CODE=is0N+YQzlE4==
FAWRY_SECURE_KEY=your_secure_key
FAWRY_ENV=sandbox  # Change to 'production' when ready
```

### 2. Register Webhook URLs

Both gateways need to know where to send payment notifications:

**PayMob Webhook:**
- URL: `https://yourdomain.com/api/payments/paymob/webhook`
- Method: POST
- Register in PayMob dashboard

**Fawry Webhook:**
- URL: `https://yourdomain.com/api/payments/fawry/callback`
- Method: POST
- Contact Fawry support to register

---

## 🎯 How It Works

### Payment Flow

1. **Student requests subscription** to a lesson folder
2. **Teacher/Owner approves** payment request
3. **Student chooses payment gateway** (PayMob or Fawry)
4. **Student enters payment details**:
   - Name, email, phone number
   - Chooses payment method (card, wallet, or Fawry cash)
5. **Payment is processed**:
   - For cards: Redirects to secure 3DS page
   - For Fawry cash: Shows reference number
6. **Webhook confirms payment**:
   - Automatically creates subscription
   - Sends notification to student
   - Grants access to lessons

### Supported Payment Methods

| Gateway | Method | Description |
|---------|--------|-------------|
| PayMob | Credit/Debit Card | Visa, Mastercard, Meeza |
| PayMob | Mobile Wallet | Vodafone Cash, Etisalat Cash |
| PayMob | Fawry | Via PayMob's Fawry integration |
| Fawry | Cash Payment | Pay at any Fawry location |
| Fawry | Credit/Debit Card | With 3D Secure |

---

## 🧪 Testing

### Test PayMob

```bash
# Use these test credentials in PayMob test mode:
Card Number: 4111111111111111
CVV: 123
Expiry: 05/25
```

### Test Fawry

```bash
# Fawry test cards:
Visa Success: 4242 4242 4242 4242
Mastercard Success: 5436 0310 3060 6378
CVV: 123
Expiry: 05/25
```

For Fawry cash payments, a test reference number will be generated that's valid for 7 days.

---

## 📦 API Endpoints

### PayMob

- **POST** `/api/payments/paymob/create-intention` - Create payment intention
- **POST** `/api/payments/paymob/webhook` - Receive payment notifications

### Fawry

- **POST** `/api/payments/fawry/charge` - Initiate payment
- **POST** `/api/payments/fawry/status` - Check payment status
- **POST** `/api/payments/fawry/callback` - Receive payment notifications

---

## 🔐 Security

- ✅ All webhooks verify HMAC signatures
- ✅ Payment data never stored in plain text
- ✅ 3D Secure for card payments
- ✅ HTTPS required for production webhooks
- ✅ Environment variables for sensitive keys

---

## 🚀 Going to Production

### PayMob Production Checklist

- [ ] Complete business verification in PayMob dashboard
- [ ] Switch from Test Mode to Live Mode
- [ ] Update environment variables with production keys
- [ ] Test with real small transaction
- [ ] Register production webhook URL
- [ ] Monitor first few transactions

### Fawry Production Checklist

- [ ] Complete business verification with Fawry
- [ ] Receive production credentials
- [ ] Change `FAWRY_ENV=production` in .env
- [ ] Register production webhook with Fawry support
- [ ] Test with real small transaction
- [ ] Monitor first few transactions

---

## 💰 Transaction Fees

### PayMob Fees (Approximate)
- Credit/Debit Cards: 2.5% + 1 EGP per transaction
- Mobile Wallets: 1.75% + 1 EGP per transaction
- Fawry: 2% + 1 EGP per transaction

### Fawry Fees (Approximate)
- Cash Payments: 1.5 EGP per transaction
- Card Payments: 2.5% + 1 EGP per transaction

*Note: Exact fees depend on your merchant agreement. Check with each provider.*

---

## 📞 Support

- **PayMob Support**: support@paymob.com | https://accept.paymob.com/support
- **Fawry Support**: merchantsupport@fawry.com | https://www.fawry.com/contact

---

## 🎓 Integration in Your Platform

The `PaymentGatewaySelector` component is ready to use. It's automatically integrated with:

- ✅ Student payment request workflow
- ✅ Subscription management system
- ✅ Notification system
- ✅ Owner dashboard approval flow

Students can now pay for subscriptions using Egyptian payment methods! 🎉
