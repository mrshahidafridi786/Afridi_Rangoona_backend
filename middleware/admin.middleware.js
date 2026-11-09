import { USER_ROLES } from '../config/constants.js';
import { errorResponse } from '../utils/apiResponse.js';

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return errorResponse(
      res,
      'Access denied. Administrator privileges are required to perform this action.',
      403
    );
  }
  next();
};
