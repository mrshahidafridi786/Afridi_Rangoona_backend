import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Helper to generate a clean URL slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      featured,
      inStock,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = { status: 'active' };

    // Full-text search or regex
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter by ID or slug
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          query.category = cat._id;
        } else {
          query.category = null;
        }
      }
    }

    // Price range filter (avoid empty object { price: {} } when params are empty string)
    const minP = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
    const maxP = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
    if ((minP !== null && !isNaN(minP)) || (maxP !== null && !isNaN(maxP))) {
      query.price = {};
      if (minP !== null && !isNaN(minP)) query.price.$gte = minP;
      if (maxP !== null && !isNaN(maxP)) query.price.$lte = maxP;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1 };
    else if (sort === 'popularity') sortOption = { reviewCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    return successResponse(res, 'Products retrieved successfully.', {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let product = await Product.findOne({ slug }).populate('category', 'name slug');

    // Fallback: If not found by slug and param matches Mongo ObjectId format, try by ID
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate('category', 'name slug');
    }

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, 'Product retrieved successfully.', { product });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category', 'name slug');

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, 'Product retrieved successfully.', { product });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ featured: true, status: 'active' })
      .populate('category', 'name slug')
      .limit(8)
      .lean();

    return successResponse(res, 'Featured products retrieved successfully.', { products });
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return successResponse(res, 'New arrivals retrieved successfully.', { products });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const current = await Product.findById(id);

    if (!current) {
      return errorResponse(res, 'Product not found.', 404);
    }

    const related = await Product.find({
      category: current.category,
      _id: { $ne: current._id },
      status: 'active'
    })
      .limit(4)
      .lean();

    return successResponse(res, 'Related products retrieved successfully.', { products: related });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      variants,
      stock,
      featured,
      specifications,
      tags
    } = req.body;

    if (!name || !price || !category) {
      return errorResponse(res, 'Name, price, and category are required.', 400);
    }

    const baseSlug = slugify(name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Calculate total stock if variants are provided
    let calculatedStock = Number(stock) || 0;
    if (Array.isArray(variants) && variants.length > 0) {
      calculatedStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }

    const product = await Product.create({
      name: name.trim(),
      slug: uniqueSlug,
      description: description || '',
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      images: Array.isArray(images) && images.length > 0 ? images : ['/assets/placeholder.jpg'],
      category,
      variants: Array.isArray(variants) ? variants : [],
      stock: calculatedStock,
      featured: Boolean(featured),
      specifications: Array.isArray(specifications) ? specifications : [],
      tags: Array.isArray(tags) ? tags : []
    });

    return successResponse(res, 'Product created successfully.', { product }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.name) {
      updates.slug = slugify(updates.name);
    }

    if (Array.isArray(updates.variants) && updates.variants.length > 0) {
      updates.stock = updates.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug');

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, 'Product updated successfully.', { product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { status: 'archived' }, { new: true });

    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    return successResponse(res, 'Product archived successfully.');
  } catch (error) {
    next(error);
  }
};
