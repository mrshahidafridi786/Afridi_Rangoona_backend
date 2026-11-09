import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { getPaymentAdapter, getPaymentProvidersStatus } from '../services/payment/index.js';
import { PAYMENT_STATUS, ORDER_STATUS } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProviders = (req, res) => {
  return successResponse(res, 'Payment providers fetched.', getPaymentProvidersStatus());
};

export const createPaymentSession = async (req, res, next) => {
  try {
    const { orderId, provider = 'stripe' } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized to initiate payment for this order.', 403);
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return errorResponse(res, 'This order has already been paid.', 400);
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const returnUrl = `${clientUrl}/payment/result`;
    const cancelUrl = `${clientUrl}/checkout`;

    const adapter = getPaymentAdapter(provider);
    const session = await adapter.createPaymentSession({
      order,
      customer: req.user,
      returnUrl,
      cancelUrl
    });

    order.paymentReference = session.referenceId;
    order.paymentMethod = adapter.name;
    await order.save();

    return successResponse(res, 'Payment session created.', {
      checkoutUrl: session.checkoutUrl,
      referenceId: session.referenceId,
      provider: adapter.name,
      isSimulated: session.isSimulated || false
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { orderNumber, referenceId, provider = 'sandbox' } = req.body;

    if (!orderNumber || !referenceId) {
      return errorResponse(res, 'Order number and payment reference are required.', 400);
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return errorResponse(res, 'Order not found.', 404);
    }

    const adapter = getPaymentAdapter(provider);
    const verification = await adapter.verifyPayment(referenceId);

    if (verification.verified) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      if (order.orderStatus === ORDER_STATUS.PENDING) {
        order.orderStatus = ORDER_STATUS.CONFIRMED;
      }
      order.paymentReference = referenceId;
      await order.save();

      // Log Payment in ledger
      await Payment.create({
        order: order._id,
        provider: adapter.name,
        providerReference: referenceId,
        amount: order.totalAmount,
        currency: process.env.CURRENCY || 'PKR',
        status: PAYMENT_STATUS.PAID,
        rawResponse: verification.details,
        verifiedAt: new Date()
      });

      return successResponse(res, 'Payment verified successfully.', {
        order,
        verified: true
      });
    } else {
      return successResponse(res, 'Payment verification pending or failed.', {
        order,
        verified: false
      });
    }
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const provider = req.params.provider || 'stripe';
    const adapter = getPaymentAdapter(provider);

    const result = await adapter.processWebhook(req.headers, req.body);
    if (result && result.orderNumber) {
      const order = await Order.findOne({ orderNumber: result.orderNumber });
      if (order && order.paymentStatus !== PAYMENT_STATUS.PAID) {
        order.paymentStatus = PAYMENT_STATUS.PAID;
        order.orderStatus = ORDER_STATUS.CONFIRMED;
        order.paymentReference = result.providerReference;
        await order.save();

        await Payment.create({
          order: order._id,
          provider: adapter.name,
          providerReference: result.providerReference,
          amount: order.totalAmount,
          currency: process.env.CURRENCY || 'PKR',
          status: PAYMENT_STATUS.PAID,
          verifiedAt: new Date()
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Processing Error]', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
