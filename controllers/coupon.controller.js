import Coupon from '../models/Coupon.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      return errorResponse(res, 'Coupon code is required.', 400);
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      expiresAt: { $gte: new Date() }
    });

    if (!coupon) {
      return errorResponse(res, 'Invalid or expired coupon code.', 400);
    }

    if (subtotal < coupon.minSpend) {
      return errorResponse(
        res,
        `Coupon requires a minimum order subtotal of PKR ${coupon.minSpend.toLocaleString()}.`,
        400
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(subtotal, coupon.discountValue);
    }

    return successResponse(res, 'Coupon applied successfully.', {
      code: coupon.code,
      discount: Math.round(discount),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return successResponse(res, 'Coupons fetched.', { coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minSpend, maxDiscount, expiresAt } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return errorResponse(res, 'Code, discount type, value, and expiration date are required.', 400);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minSpend: Number(minSpend) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiresAt: new Date(expiresAt)
    });

    return successResponse(res, 'Coupon created successfully.', { coupon }, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    return successResponse(res, 'Coupon deleted.');
  } catch (error) {
    next(error);
  }
};
