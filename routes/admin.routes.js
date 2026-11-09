import express from 'express';
import {
  getOverviewMetrics,
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
  getAllReviews,
  updateReviewStatus,
  getInventory,
  updateStock
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Apply requireAuth and requireAdmin to all routes in this router
router.use(requireAuth, requireAdmin);

router.get('/metrics', getOverviewMetrics);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerDetails);
router.put('/customers/:id/status', toggleCustomerStatus);
router.get('/reviews', getAllReviews);
router.put('/reviews/:id/status', updateReviewStatus);
router.get('/inventory', getInventory);
router.put('/inventory/:productId', updateStock);

export default router;
