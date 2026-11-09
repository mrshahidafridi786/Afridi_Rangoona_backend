import { PaymentAdapter } from './PaymentAdapter.js';
import Stripe from 'stripe';

export class StripeAdapter extends PaymentAdapter {
  constructor() {
    super('stripe');
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.isConfigured = Boolean(this.secretKey && !this.secretKey.includes('placeholder'));
    
    if (this.isConfigured) {
      this.stripe = new Stripe(this.secretKey);
    }
  }

  async createPaymentSession({ order, customer, returnUrl, cancelUrl }) {
    if (!this.isConfigured) {
      throw new Error('Stripe is not configured with valid API keys. Please configure STRIPE_SECRET_KEY in server/.env.');
    }

    const lineItems = order.items.map(item => ({
      price_data: {
        currency: (process.env.CURRENCY || 'pkr').toLowerCase(),
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: item.variantSku ? `SKU: ${item.variantSku}` : undefined
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (order.shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: (process.env.CURRENCY || 'pkr').toLowerCase(),
          product_data: {
            name: 'Standard Insured Shipping',
          },
          unit_amount: Math.round(order.shippingFee * 100),
        },
        quantity: 1,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer.email,
      client_reference_id: order.orderNumber,
      line_items: lineItems,
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&order=${order.orderNumber}`,
      cancel_url: `${cancelUrl}?order=${order.orderNumber}`,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber
      }
    });

    return {
      checkoutUrl: session.url,
      referenceId: session.id,
      status: 'Pending'
    };
  }

  async verifyPayment(sessionId) {
    if (!this.isConfigured) {
      throw new Error('Stripe is not configured.');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const isPaid = session.payment_status === 'paid';

    return {
      verified: isPaid,
      status: isPaid ? 'Paid' : 'Pending',
      details: {
        paymentIntentId: session.payment_intent,
        amountTotal: session.amount_total / 100,
        currency: session.currency
      }
    };
  }

  async processWebhook(headers, rawBody) {
    if (!this.isConfigured || !this.webhookSecret) {
      throw new Error('Stripe webhook secret is not configured.');
    }

    const sig = headers['stripe-signature'];
    const event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      return {
        orderNumber: session.client_reference_id || session.metadata?.orderNumber,
        status: 'Paid',
        providerReference: session.id
      };
    }

    return null;
  }
}
