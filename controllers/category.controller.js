import Category from '../models/Category.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 }).lean();
    return successResponse(res, 'Categories retrieved successfully.', { categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    if (!name) {
      return errorResponse(res, 'Category name is required.', 400);
    }

    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return errorResponse(res, 'A category with this name already exists.', 409);
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      image: image || ''
    });

    return successResponse(res, 'Category created successfully.', { category }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, status } = req.body;

    const updates = {};
    if (name) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (status) updates.status = status;

    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!category) {
      return errorResponse(res, 'Category not found.', 404);
    }

    return successResponse(res, 'Category updated successfully.', { category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return errorResponse(res, 'Category not found.', 404);
    }
    return successResponse(res, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};
