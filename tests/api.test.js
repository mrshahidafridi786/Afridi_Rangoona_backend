import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app, { startServer } from '../server.js';
import { closeDB } from '../config/db.js';

describe('AFRIDI RANGOONA — Backend Comprehensive API Test Suite', () => {
  let customerToken = '';
  let adminToken = '';
  let testProductId = '';
  let testProductSlug = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await startServer();
  }, 30000);

  afterAll(async () => {
    await closeDB();
  });

  // 1. System Health Check
  it('GET /api/health returns online status and service metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toContain('AFRIDI RANGOONA');
  });

  // 2. Product Catalog API
  it('GET /api/v1/products retrieves paginated luxury catalog', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThan(0);

    const firstProduct = res.body.data.products[0];
    testProductId = firstProduct._id;
    testProductSlug = firstProduct.slug;
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('stock');
  });

  it('GET /api/v1/products/slug/:slug retrieves accurate PDP data', async () => {
    const res = await request(app).get(`/api/v1/products/slug/${testProductSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.slug).toBe(testProductSlug);
  });

  // 3. Customer Authentication & Security Edge Cases
  it('POST /api/v1/auth/login authenticates seeded demo customer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@afridirangoona.com',
        password: 'Customer@2026'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    customerToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'customer@afridirangoona.com',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/register prevents duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Test',
        email: 'customer@afridirangoona.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already registered');
  });

  // 4. Role-Based Access Control (RBAC)
  it('GET /api/v1/admin/metrics strictly prohibits customer from accessing admin console', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Administrator privileges are required');
  });

  it('POST /api/v1/auth/login logs in administrator and permits access to metrics', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@afridirangoona.com',
        password: 'Admin@Afridi2026'
      });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;

    const metricRes = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(metricRes.status).toBe(200);
    expect(metricRes.body.success).toBe(true);
    expect(metricRes.body.data.metrics).toHaveProperty('totalRevenue');
  });

  // 5. Deterministic Server Pricing & Cart Verification
  it('POST /api/v1/cart/quote verifies server calculation and applies coupon', async () => {
    const res = await request(app)
      .post('/api/v1/cart/quote')
      .send({
        items: [{ productId: testProductId, quantity: 1 }],
        couponCode: 'WELCOME10'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quote.discount).toBeGreaterThan(0);
    expect(res.body.data.quote.couponApplied).toBe('WELCOME10');
  });

  // 6. Verified Review Gate Check
  it('POST /api/v1/reviews rejects review submission without delivered order', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: '67c7e651e067160000000000',
        rating: 5,
        title: 'Fake Review',
        comment: 'This should be blocked by backend purchase verification.'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Only customers who have purchased and received');
  });
});
