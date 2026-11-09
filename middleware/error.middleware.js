import { errorResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return errorResponse(res, messages.join(', '), 400, messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `A record with this ${field} already exists.`, 409);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid format for resource identifier: ${err.value}`, 400);
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected internal error occurred on the server.';
  
  return errorResponse(res, message, statusCode);
};
