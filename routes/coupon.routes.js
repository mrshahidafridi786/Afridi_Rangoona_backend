import express from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon
} from '../controllers/coupon.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.post('/validate', validateCoupon);
router.get('/', requireAuth, requireAdmin, getCoupons);
router.post('/', requireAuth, requireAdmin, createCoupon);
router.delete('/:id', requireAuth, requireAdmin, deleteCoupon);

export default router;
