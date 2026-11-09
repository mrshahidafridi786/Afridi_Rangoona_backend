export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  SAFEPAY: 'safepay',
  COD: 'cod',
  SANDBOX: 'sandbox'
};

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

export const REVIEW_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  FLAGGED: 'flagged'
};
