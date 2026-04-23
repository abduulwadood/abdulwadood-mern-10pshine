'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // Use different port so tests don't clash with dev server

const { expect } = require('chai');
const request = require('supertest');

// Load app AFTER setting env so dotenv doesn't override NODE_ENV
const app = require('../../src/server');

describe('Integration: Express Server', () => {
  // ── 404 handling ─────────────────────────────────────────────────────────
  describe('Unknown routes', () => {
    it('returns 404 for an unknown GET route', async () => {
      const res = await request(app).get('/api/this-does-not-exist');
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('Cannot GET');
    });

    it('returns 404 for an unknown POST route', async () => {
      const res = await request(app).post('/api/nonexistent');
      expect(res.status).to.equal(404);
    });
  });

  // ── Security headers ─────────────────────────────────────────────────────
  describe('Security headers (Helmet)', () => {
    it('sets X-Content-Type-Options header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).to.have.property('x-content-type-options');
    });

    it('sets X-Frame-Options header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).to.have.property('x-frame-options');
    });
  });

  // ── Health check ─────────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('responds with a JSON body', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).to.match(/json/);
    });

    it('returns the expected response shape', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body).to.have.keys(['success', 'message', 'data', 'error', 'timestamp']);
    });

    it('includes server and application metadata', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.data).to.have.property('server');
      expect(res.body.data).to.have.property('application');
      expect(res.body.data).to.have.property('database');
    });

    it('includes an uptime value', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.data.server.uptime).to.be.a('number');
    });

    it('sets X-Request-ID response header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).to.have.property('x-request-id');
    });
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  describe('CORS', () => {
    it('allows requests from the configured origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).to.equal('http://localhost:3000');
    });

    it('handles OPTIONS preflight requests', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.status).to.be.oneOf([200, 204]);
    });
  });

  // ── JSON body parsing ─────────────────────────────────────────────────────
  describe('Body parsing', () => {
    it('parses a JSON body without error', async () => {
      const res = await request(app)
        .post('/api/health') // will 404 but we only care it parses without crash
        .set('Content-Type', 'application/json')
        .send({ key: 'value' });
      // 404 is fine — what matters is we didn't get a 500
      expect(res.status).to.equal(404);
    });
  });
});
