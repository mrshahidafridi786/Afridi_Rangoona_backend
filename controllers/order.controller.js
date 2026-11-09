import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { calculateCartTotals } from '../services/cart.service.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Generate human-friendly order tracking number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `AR-${dateStr}-${randomSuffix}`;
};

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod = 'Stripe Sandbox' } = req.body;

    if (!items || items.length === 0) {
      return errorResponse(res, 'Order must contain at least one item.', 400);
    }

    if (!shippingAddress || !shippingAddress.recipientName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
      return errorResponse(res, 'Please provide complete shipping address details.', 400);
    }

    // Deterministically calculate and verify all pricing on the backend
    const quote = await calculateCartTotals(items, couponCode);

    if (quote.items.length === 0) {
      return errorResponse(res, 'None of the requested products are currently available.', 400);
    }

    // Verify stock availability
    for (const item of quote.items) {
      if (!item.inStock || item.quantity > item.maxStock) {
        return errorResponse(res, `Insufficient stock for product "${item.name}". Available: ${item.maxStock}`, 400);
      }
    }

    // Build historical order item snapshots
    const orderItems = quote.items.map(item => ({
      product: item.product,
      name: item.name,
      image: item.image,
      variantSku: item.variantSku,
      color: item.color,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        recipientName: shippingAddress.recipientName.trim(),
        phone: shippingAddress.phone.trim(),
        email: shippingAddress.email ? shippingAddress.email.trim() : req.user.email,
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode ? shippingAddress.postalCode.trim() : '00000',
        country: shippingAddress.country || 'Pakistan'
      },
      subtotal: quote.subtotal,
      discount: quote.discount,
      shippingFee: quote.shippingFee,
      totalAmount: quote.totalAmount,
      couponApplied: quote.couponApplied,
      paymentMethod,
      orderStatus: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING
    });

    // Decrement stock
    for (const item of quote.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });

      if (item.variantSku) {
        await Product.updateOne(
          { _id: item.product, 'variants.sku': item.variantSku },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
      }
    }

    // Clear user's cloud cart upon successful order creation
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    return successResponse(res, 'Order created successfully.', { order }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 'Orders fetched successfully.', { orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    } else {
      order = await Order.findOne({ orderNumber: id.trim() });
    }

    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    // Authorization: User must own the order or be an admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'You are not authorized to view this order.', 403);
    }

    return successResponse(res, 'Order retrieved successfully.', { order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(id);

    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized to cancel this order.', 403);
    }

    // Cancellation eligibility check
    if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.orderStatus)) {
      return errorResponse(
        res,
        `Cannot cancel order in "${order.orderStatus}" status. Orders can only be cancelled while Pending or Confirmed.`,
        400
      );
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancelReason = reason || 'Cancelled by customer';
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
      if (item.variantSku) {
        await Product.updateOne(
          { _id: item.product, 'variants.sku': item.variantSku },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      }
    }

    return successResponse(res, 'Order cancelled successfully and inventory restored.', { order });
  } catch (error) {
    next(error);
  }
};

export const trackOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber || !email) {
      return errorResponse(res, 'Order number and email address are required.', 400);
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim(),
      'shippingAddress.email': email.toLowerCase().trim()
    });

    if (!order) {
      return errorResponse(res, 'No order found matching the provided order number and email.', 404);
    }

    return successResponse(res, 'Order found.', { order });
  } catch (error) {
    next(error);
  }
};
