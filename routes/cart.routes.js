import express from 'express';
import {
  getCart,
  syncCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  calculateQuote
} from '../controllers/cart.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/quote', calculateQuote);
router.get('/', requireAuth, getCart);
router.post('/sync', requireAuth, syncCart);
router.post('/items', requireAuth, addItem);
router.put('/items/:itemId', requireAuth, updateQuantity);
router.delete('/items/:itemId', requireAuth, removeItem);
router.delete('/clear', requireAuth, clearCart);

export default router;
