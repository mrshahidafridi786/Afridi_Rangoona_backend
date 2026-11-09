import express from 'express';
import {
  getProviders,
  createPaymentSession,
  verifyPayment,
  handleWebhook
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/providers', getProviders);
router.post('/create-session', requireAuth, createPaymentSession);
router.post('/verify', requireAuth, verifyPayment);
router.post('/webhook/:provider?', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
