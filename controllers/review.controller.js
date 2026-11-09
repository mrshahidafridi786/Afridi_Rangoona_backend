import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { ORDER_STATUS } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 'Reviews fetched successfully.', { reviews });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating || !comment) {
      return errorResponse(res, 'Product ID, rating (1-5), and written comment are required.', 400);
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5 stars.', 400);
    }

    // STRICT VERIFIED PURCHASE RULE:
    // Only customers who have purchased and received the product (Delivered status) can review
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: ORDER_STATUS.DELIVERED,
      'items.product': productId
    });

    if (!deliveredOrder) {
      return errorResponse(
        res,
        'Only customers who have purchased and received this product (order marked Delivered) can submit a review.',
        403
      );
    }

    // Prohibit duplicate reviews for this order and product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: deliveredOrder._id
    });

    if (existingReview) {
      return errorResponse(res, 'You have already submitted a review for this purchase.', 400);
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: deliveredOrder._id,
      rating: numRating,
      title: title ? title.trim() : '',
      comment: comment.trim(),
      verifiedPurchase: true,
      status: 'approved'
    });

    return successResponse(res, 'Review submitted successfully. Thank you for your feedback.', { review }, 201);
  } catch (error) {
    next(error);
  }
};

export const checkReviewEligibility = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: ORDER_STATUS.DELIVERED,
      'items.product': productId
    });

    if (!deliveredOrder) {
      return successResponse(res, 'Eligibility checked.', { canReview: false, reason: 'No delivered order found.' });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: deliveredOrder._id
    });

    return successResponse(res, 'Eligibility checked.', {
      canReview: !existingReview,
      reason: existingReview ? 'Review already submitted for this order.' : 'Eligible to submit review.'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return errorResponse(res, 'Review not found.', 404);
    }

    // Only owner or admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized to delete this review.', 403);
    }

    await Review.findByIdAndDelete(id);
    return successResponse(res, 'Review removed successfully.');
  } catch (error) {
    next(error);
  }
};
