import express from 'express';
import {
  getProductReviews,
  submitReview,
  checkReviewEligibility,
  deleteReview
} from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.get('/eligibility/:productId', requireAuth, checkReviewEligibility);
router.post('/', requireAuth, submitReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
