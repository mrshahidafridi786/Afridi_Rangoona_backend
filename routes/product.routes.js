import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { successResponse } from '../utils/apiResponse.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);

// Admin routes
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

// Image upload helper endpoint
router.post('/upload', requireAuth, requireAdmin, upload.single('image'), (req, res) => {
  const imageUrl = `/uploads/${req.file.filename}`;
  return successResponse(res, 'Image uploaded successfully.', { url: imageUrl });
});

export default router;
