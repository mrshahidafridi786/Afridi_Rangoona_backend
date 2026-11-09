import { PaymentAdapter } from './PaymentAdapter.js';

export class MockAdapter extends PaymentAdapter {
  constructor() {
    super('sandbox');
  }

  async createPaymentSession({ order, customer, returnUrl, cancelUrl }) {
    const referenceId = `sim_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const checkoutUrl = `${returnUrl}?session_id=${referenceId}&order=${order.orderNumber}&mode=sandbox`;

    return {
      checkoutUrl,
      referenceId,
      status: 'Pending',
      isSimulated: true
    };
  }

  async verifyPayment(referenceId) {
    // Validates that it is a recognized sandbox reference
    const isValidSim = referenceId && referenceId.startsWith('sim_sbx_');
    return {
      verified: isValidSim,
      status: isValidSim ? 'Paid' : 'Pending',
      details: {
        provider: 'sandbox',
        referenceId,
        note: 'Verified in local sandbox test mode'
      }
    };
  }

  async processWebhook(headers, rawBody) {
    return {
      orderNumber: rawBody.orderNumber,
      status: rawBody.status || 'Paid',
      providerReference: rawBody.referenceId || 'sim_sbx_webhook'
    };
  }
}
