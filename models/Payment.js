import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true
  },
  providerReference: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PKR'
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    required: true
  },
  rawResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
