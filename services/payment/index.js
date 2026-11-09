import { StripeAdapter } from './StripeAdapter.js';
import { SafepayAdapter } from './SafepayAdapter.js';
import { MockAdapter } from './MockAdapter.js';

const adapters = {
  stripe: new StripeAdapter(),
  safepay: new SafepayAdapter(),
  sandbox: new MockAdapter()
};

export const getPaymentAdapter = (provider = 'stripe') => {
  const normalizedProvider = provider.toLowerCase();
  
  if (normalizedProvider === 'stripe' && adapters.stripe.isConfigured) {
    return adapters.stripe;
  }
  
  if (normalizedProvider === 'safepay' && adapters.safepay.isConfigured) {
    return adapters.safepay;
  }

  // Fallback to sandbox simulator when external provider credentials are placeholder
  return adapters.sandbox;
};

export const getPaymentProvidersStatus = () => {
  return {
    stripe: {
      enabled: adapters.stripe.isConfigured,
      name: 'Stripe Test Mode'
    },
    safepay: {
      enabled: adapters.safepay.isConfigured,
      name: 'Safepay Sandbox'
    },
    sandbox: {
      enabled: true,
      name: 'Local Sandbox Simulator'
    }
  };
};
