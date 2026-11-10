import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Import Route Handlers
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import adminRoutes from './routes/admin.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import { seedDatabaseIfEmpty } from './utils/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL);

// Trust Vercel / reverse proxy headers for accurate client IP & rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://afridi-rangoona-frontend-2bki.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parsing & Cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

if (process.env.NODE_ENV === 'development' && !isVercel) {
  app.use(morgan('dev'));
}

// Global API Rate Limiting (exempt in test)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', apiLimiter);
}

// Static uploads directory
app.use('/uploads', express.static(path.resolve('uploads')));

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'AFRIDI RANGOONA API Gateway',
    version: '1.0.0',
    frontend: 'https://afridi-rangoona-frontend-2bki.vercel.app',
    health: '/api/health'
  });
});

app.get('/api/health', async (req, res) => {
  let dbConnected = false;
  try {
    if (process.env.NODE_ENV !== 'test') {
      await connectDB();
      dbConnected = true;
    }
  } catch (err) {
    dbConnected = false;
  }

  res.status(200).json({
    status: 'online',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'AFRIDI RANGOONA API Gateway',
    version: '1.0.0'
  });
});

// Ensure MongoDB connection is established before handling API V1 requests (critical for Vercel Serverless)
let initializedPromise = null;
const ensureServerlessReady = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  try {
    if (!initializedPromise) {
      initializedPromise = (async () => {
        await connectDB();
        await seedDatabaseIfEmpty();
      })().catch((err) => {
        initializedPromise = null;
        throw err;
      });
    }
    await initializedPromise;
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};

// REST API V1 Routers
app.use('/api/v1', ensureServerlessReady);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);

// 404 & Centralized Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap Server & DB Connection for non-serverless environments
export const startServer = async () => {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();

    if (process.env.NODE_ENV !== 'test' && !isVercel) {
      const server = app.listen(PORT, () => {
        console.log(`[Server] AFRIDI RANGOONA Backend running in ${process.env.NODE_ENV || 'development'} on http://localhost:${PORT}`);
      });
      return server;
    }
  } catch (error) {
    console.error(`[Server Startup Error] ${error.message}`);
    if (process.env.NODE_ENV !== 'test' && !isVercel) {
      process.exit(1);
    }
  }
};

// Auto start locally if not in test runner or Vercel serverless runtime
if (process.env.NODE_ENV !== 'test' && !isVercel) {
  startServer();
}

export default app;
