/**
 * Base Abstract Payment Adapter
 * Defines the contract all payment gateway integrations must fulfill.
 */
export class PaymentAdapter {
  constructor(name) {
    this.name = name;
  }

  /**
   * Initializes a checkout transaction session
   * @param {Object} params - { order, customer, returnUrl, cancelUrl }
   * @returns {Promise<{ checkoutUrl: string, referenceId: string, status: string }>}
   */
  async createPaymentSession(params) {
    throw new Error('createPaymentSession() must be implemented by adapter subclass');
  }

  /**
   * Verifies the status of a payment by its gateway reference
   * @param {string} referenceId
   * @returns {Promise<{ verified: boolean, status: string, details: Object }>}
   */
  async verifyPayment(referenceId) {
    throw new Error('verifyPayment() must be implemented by adapter subclass');
  }

  /**
   * Processes external webhook notification
   * @param {Object} headers
   * @param {Buffer|Object} rawBody
   * @returns {Promise<{ orderNumber: string, status: string, providerReference: string }>}
   */
  async processWebhook(headers, rawBody) {
    throw new Error('processWebhook() must be implemented by adapter subclass');
  }
}
