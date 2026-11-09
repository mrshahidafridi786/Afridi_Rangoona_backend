import { PaymentAdapter } from './PaymentAdapter.js';
import crypto from 'crypto';

export class SafepayAdapter extends PaymentAdapter {
  constructor() {
    super('safepay');
    this.apiKey = process.env.SAFEPAY_API_KEY;
    this.webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
    this.environment = process.env.SAFEPAY_ENVIRONMENT || 'sandbox';
    this.isConfigured = Boolean(this.apiKey && !this.apiKey.includes('placeholder'));
  }

  async createPaymentSession({ order, customer, returnUrl, cancelUrl }) {
    if (!this.isConfigured) {
      throw new Error('Safepay Sandbox is not configured with valid merchant credentials. Please set SAFEPAY_API_KEY in server/.env.');
    }

    // In a live integration, requests to Safepay Checkout API create a tracker token
    const tracker = `track_safe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const checkoutUrl = `https://${this.environment === 'production' ? 'api' : 'sandbox'}.getsafepay.com/checkout/pay?beacon=${tracker}`;

    return {
      checkoutUrl,
      referenceId: tracker,
      status: 'Pending'
    };
  }

  async verifyPayment(trackerId) {
    if (!this.isConfigured) {
      throw new Error('Safepay is not configured.');
    }

    return {
      verified: false,
      status: 'Pending',
      details: { trackerId }
    };
  }

  async processWebhook(headers, rawBody) {
    if (!this.isConfigured || !this.webhookSecret) {
      throw new Error('Safepay webhook signature validation requires SAFEPAY_WEBHOOK_SECRET.');
    }

    const signature = headers['x-sfpy-signature'];
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)).digest('hex');

    if (signature !== digest) {
      throw new Error('Invalid Safepay webhook signature');
    }

    const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    return {
      orderNumber: data.data?.metadata?.orderNumber,
      status: data.event === 'payment.completed' ? 'Paid' : 'Failed',
      providerReference: data.data?.token
    };
  }
}
