import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

export const calculateCartTotals = async (items = [], couponCode = null) => {
  if (!items || items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      shippingFee: 0,
      totalAmount: 0,
      itemCount: 0,
      couponApplied: null
    };
  }

  const populatedItems = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const product = await Product.findById(item.product || item.productId);
    if (!product || product.status !== 'active') {
      continue;
    }

    // Determine variant & stock
    let unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    let selectedVariant = null;
    let maxAvailableStock = product.stock;

    if (item.variantSku && product.variants?.length > 0) {
      selectedVariant = product.variants.find(v => v.sku === item.variantSku);
      if (selectedVariant) {
        maxAvailableStock = selectedVariant.stock;
        if (selectedVariant.priceAdjustment) {
          unitPrice += selectedVariant.priceAdjustment;
        }
      }
    }

    // Clamp quantity to available inventory
    const safeQuantity = Math.max(1, Math.min(item.quantity, maxAvailableStock > 0 ? maxAvailableStock : 1));
    const lineSubtotal = unitPrice * safeQuantity;

    subtotal += lineSubtotal;
    totalQuantity += safeQuantity;

    populatedItems.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || '',
      price: unitPrice,
      originalPrice: product.price,
      quantity: safeQuantity,
      variantSku: item.variantSku || '',
      color: item.color || selectedVariant?.color || '',
      size: item.size || selectedVariant?.size || '',
      subtotal: lineSubtotal,
      inStock: maxAvailableStock > 0,
      maxStock: maxAvailableStock
    });
  }

  // Calculate Shipping
  const freeShippingThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD) || 5000;
  const defaultShippingFee = Number(process.env.DEFAULT_SHIPPING_FEE) || 250;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : defaultShippingFee;

  // Calculate Coupon Discount
  let discount = 0;
  let validatedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true,
      expiresAt: { $gte: new Date() }
    });

    if (coupon && subtotal >= coupon.minSpend) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = Math.min(subtotal, coupon.discountValue);
      }
      discount = Math.round(discount);
      validatedCoupon = coupon.code;
    }
  }

  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  return {
    items: populatedItems,
    subtotal,
    discount,
    shippingFee,
    totalAmount,
    itemCount: totalQuantity,
    couponApplied: validatedCoupon
  };
};

export const mergeGuestCart = (userCartItems = [], guestCartItems = []) => {
  const mergedMap = new Map();

  // Load existing user items into map
  userCartItems.forEach(item => {
    const key = `${item.product.toString()}_${item.variantSku || ''}`;
    mergedMap.set(key, { ...item.toObject ? item.toObject() : item });
  });

  // Merge or add guest items
  guestCartItems.forEach(guestItem => {
    const key = `${(guestItem.product || guestItem.productId).toString()}_${guestItem.variantSku || ''}`;
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      existing.quantity += Number(guestItem.quantity) || 1;
    } else {
      mergedMap.set(key, {
        product: guestItem.product || guestItem.productId,
        variantSku: guestItem.variantSku || '',
        color: guestItem.color || '',
        size: guestItem.size || '',
        quantity: Number(guestItem.quantity) || 1
      });
    }
  });

  return Array.from(mergedMap.values());
};
