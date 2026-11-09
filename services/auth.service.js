import jwt from 'jsonwebtoken';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'afridi_rangoona_super_secure_jwt_secret_dev_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpires;
  return userObj;
};
