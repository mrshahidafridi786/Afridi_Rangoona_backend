import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrderByNumber
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/track', trackOrderByNumber);
router.post('/', requireAuth, createOrder);
router.get('/my-orders', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrderById);
router.put('/:id/cancel', requireAuth, cancelOrder);

export default router;
