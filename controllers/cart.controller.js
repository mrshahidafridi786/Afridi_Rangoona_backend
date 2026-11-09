import Cart from '../models/Cart.js';
import { calculateCartTotals, mergeGuestCart } from '../services/cart.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const totals = await calculateCartTotals(cart.items, req.query.coupon);
    return successResponse(res, 'Cart fetched successfully.', {
      cart: totals
    });
  } catch (error) {
    next(error);
  }
};

export const syncCart = async (req, res, next) => {
  try {
    const { guestItems = [] } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    if (guestItems.length > 0) {
      cart.items = mergeGuestCart(cart.items, guestItems);
      await cart.save();
    }

    const totals = await calculateCartTotals(cart.items);
    return successResponse(res, 'Cart synced successfully.', { cart: totals });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const { productId, variantSku, color, size, quantity = 1 } = req.body;
    if (!productId) {
      return errorResponse(res, 'Product ID is required.', 400);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if matching item exists
    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId && (item.variantSku || '') === (variantSku || '')
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        variantSku: variantSku || '',
        color: color || '',
        size: size || '',
        quantity: Number(quantity)
      });
    }

    await cart.save();
    const totals = await calculateCartTotals(cart.items);
    return successResponse(res, 'Item added to cart.', { cart: totals });
  } catch (error) {
    next(error);
  }
};

export const updateQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return errorResponse(res, 'Cart not found.', 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return errorResponse(res, 'Item not found in cart.', 404);
    }

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      item.quantity = Number(quantity);
    }

    await cart.save();
    const totals = await calculateCartTotals(cart.items);
    return successResponse(res, 'Cart updated.', { cart: totals });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return errorResponse(res, 'Cart not found.', 404);
    }

    cart.items.pull(itemId);
    await cart.save();

    const totals = await calculateCartTotals(cart.items);
    return successResponse(res, 'Item removed from cart.', { cart: totals });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    return successResponse(res, 'Cart cleared successfully.');
  } catch (error) {
    next(error);
  }
};

export const calculateQuote = async (req, res, next) => {
  try {
    const { items = [], couponCode } = req.body;
    const totals = await calculateCartTotals(items, couponCode);
    return successResponse(res, 'Quote calculated successfully.', { quote: totals });
  } catch (error) {
    next(error);
  }
};
