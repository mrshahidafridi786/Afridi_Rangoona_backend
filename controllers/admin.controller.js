import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getOverviewMetrics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      revenueResult,
      recentOrders,
      topSelling
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: ORDER_STATUS.PENDING }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ status: { $ne: 'archived' } }),
      Product.countDocuments({ stock: { $lte: 5 }, status: 'active' }),
      Order.aggregate([
        { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Product.find({ status: 'active' })
        .sort({ reviewCount: -1, averageRating: -1 })
        .limit(5)
        .lean()
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return successResponse(res, 'Admin metrics retrieved successfully.', {
      metrics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockProducts
      },
      recentOrders,
      topSelling
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.recipientName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    return successResponse(res, 'Orders retrieved successfully.', {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    if (orderStatus) {
      if (!Object.values(ORDER_STATUS).includes(orderStatus)) {
        return errorResponse(res, 'Invalid order status transition.', 400);
      }
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
        return errorResponse(res, 'Invalid payment status.', 400);
      }
      order.paymentStatus = paymentStatus;
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber.trim();
    }

    await order.save();
    return successResponse(res, 'Order updated successfully.', { order });
  } catch (error) {
    next(error);
  }
};

export const getAllCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    return successResponse(res, 'Customers retrieved successfully.', {
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await User.findById(id);

    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 }).lean();

    return successResponse(res, 'Customer details retrieved.', {
      customer,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['active', 'suspended'].includes(accountStatus)) {
      return errorResponse(res, 'Invalid account status. Must be "active" or "suspended".', 400);
    }

    const customer = await User.findByIdAndUpdate(id, { accountStatus }, { new: true });
    if (!customer) {
      return errorResponse(res, 'Customer not found.', 404);
    }

    return successResponse(res, `Customer account status updated to ${accountStatus}.`, { customer });
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 'Reviews retrieved.', { reviews });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) {
      return errorResponse(res, 'Review not found.', 404);
    }

    return successResponse(res, 'Review status updated.', { review });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (req, res, next) => {
  try {
    const products = await Product.find({ status: { $ne: 'archived' } })
      .select('name slug stock price variants category status images')
      .populate('category', 'name')
      .sort({ stock: 1 })
      .lean();

    return successResponse(res, 'Inventory retrieved.', { products });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { stock, variants } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    if (variants && Array.isArray(variants)) {
      product.variants = variants;
      product.stock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else if (stock !== undefined) {
      product.stock = Number(stock);
    }

    await product.save();
    return successResponse(res, 'Stock updated successfully.', { product });
  } catch (error) {
    next(error);
  }
};
