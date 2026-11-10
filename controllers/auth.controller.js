import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, sanitizeUser } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required fields.', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 'Passwords do not match.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(res, 'An account is already registered with this email address.', 409);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      passwordHash: password
    });

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return successResponse(
      res,
      'Account created successfully. Welcome to AFRIDI RANGOONA.',
      {
        user: sanitizeUser(user),
        token
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Please provide both email and password.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (user.accountStatus === 'suspended') {
      return errorResponse(res, 'Your account is suspended. Please contact customer support.', 403);
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return successResponse(res, 'Logged in successfully.', {
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  return successResponse(res, 'Logged out successfully.');
};

export const getMe = async (req, res) => {
  return successResponse(res, 'Profile fetched successfully.', {
    user: sanitizeUser(req.user)
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (Array.isArray(addresses)) user.addresses = addresses;

    await user.save();

    return successResponse(res, 'Profile updated successfully.', {
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters.', 400);
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return errorResponse(res, 'New passwords do not match.', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    user.passwordHash = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Please provide an email address.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't disclose user non-existence for security
      return successResponse(res, 'If an account exists with that email, a password reset link has been dispatched.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // In a live environment, dispatch email via nodemailer/sendgrid
    console.log(`[Password Reset Dispatch] Reset token for ${email}: ${resetToken}`);

    return successResponse(res, 'If an account exists with that email, a password reset link has been dispatched.', {
      // Returned in development for rapid testing
      devResetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 'Reset token and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', 400);
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return errorResponse(res, 'Passwords do not match.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 'Password reset token is invalid or has expired.', 400);
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return successResponse(res, 'Your password has been reset successfully. You may now log in.');
  } catch (error) {
    next(error);
  }
};
