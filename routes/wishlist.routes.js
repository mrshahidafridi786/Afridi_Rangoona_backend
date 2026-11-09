import express from 'express';
import Wishlist from '../models/Wishlist.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      populate: { path: 'category', select: 'name slug' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    return successResponse(res, 'Wishlist fetched.', { wishlist });
  } catch (error) {
    next(error);
  }
});

router.post('/toggle', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return errorResponse(res, 'Product ID is required.', 400);
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isAdded = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
      isAdded = true;
    }

    await wishlist.save();
    return successResponse(res, isAdded ? 'Added to wishlist.' : 'Removed from wishlist.', {
      isAdded,
      productCount: wishlist.products.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
