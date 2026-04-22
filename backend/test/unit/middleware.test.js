'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

// Stub logger before requiring modules that import it
const loggerStub = {
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub(),
  fatal: sinon.stub(),
};

// Replace the logger module with our stub for this test file
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.includes('config/logger') || request.endsWith('logger')) {
    return loggerStub;
  }
  return originalLoad.apply(this, arguments);
};

const requestLogger = require('../../src/middleware/requestLogger');
const errorHandler = require('../../src/middleware/errorHandler');
const { sendError } = require('../../src/utils/responseHandler');
const { ValidationError, NotFoundError, AuthError } = require('../../src/utils/customErrors');
const { HTTP_STATUS } = require('../../src/config/constants');

// Restore after all tests
after(() => {
  Module._load = originalLoad;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildReq(overrides = {}) {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    headers: { 'user-agent': 'mocha-test' },
    ip: '127.0.0.1',
    body: {},
    requestId: 'test-request-id',
    on: sinon.stub().callsFake((event, cb) => {
      if (event === 'finish') cb(); // Immediately fire finish
    }),
    connection: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function buildRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    setHeader: sinon.stub().callsFake(function (k, v) { this._headers[k] = v; }),
    getHeader: sinon.stub().returns(0),
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    // Simulate Node's EventEmitter: immediately invoke 'finish' listeners
    on: sinon.stub().callsFake(function (event, cb) {
      if (event === 'finish') cb();
    }),
  };
  return res;
}

// ── requestLogger middleware ──────────────────────────────────────────────────

describe('requestLogger middleware', () => {
  beforeEach(() => {
    loggerStub.info.resetHistory();
    loggerStub.warn.resetHistory();
    loggerStub.error.resetHistory();
  });

  it('attaches a requestId to req and sets the X-Request-ID header', () => {
    const req = buildReq();
    const res = buildRes();
    const next = sinon.stub();

    delete req.requestId; // Let the middleware assign one
    requestLogger(req, res, next);

    expect(req.requestId).to.be.a('string').and.have.length.above(0);
    expect(res.setHeader.calledWith('X-Request-ID', req.requestId)).to.be.true;
    expect(next.calledOnce).to.be.true;
  });

  it('honours an existing X-Request-ID header', () => {
    const req = buildReq({ headers: { 'x-request-id': 'my-custom-id', 'user-agent': 'mocha' } });
    const res = buildRes();
    requestLogger(req, res, sinon.stub());
    expect(req.requestId).to.equal('my-custom-id');
  });

  it('masks sensitive fields in the logged body', () => {
    // Test the exported maskSensitiveFields helper directly — avoids logger stub issues
    const { maskSensitiveFields } = requestLogger;
    const masked = maskSensitiveFields({ email: 'a@b.com', password: 'secret' });
    expect(masked.password).to.equal('[REDACTED]');
    expect(masked.email).to.equal('a@b.com');
  });

  it('calls next()', () => {
    const next = sinon.stub();
    requestLogger(buildReq(), buildRes(), next);
    expect(next.calledOnce).to.be.true;
  });
});

// ── errorHandler middleware ───────────────────────────────────────────────────

describe('errorHandler middleware', () => {
  beforeEach(() => {
    loggerStub.warn.resetHistory();
    loggerStub.error.resetHistory();
  });

  it('handles ValidationError with 400 status', () => {
    const err = new ValidationError('Bad input', ['field required']);
    const res = buildRes();
    errorHandler(err, buildReq(), res, sinon.stub());
    expect(res.status.calledWith(HTTP_STATUS.BAD_REQUEST)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
  });

  it('handles NotFoundError with 404 status', () => {
    const err = new NotFoundError('Note');
    const res = buildRes();
    errorHandler(err, buildReq(), res, sinon.stub());
    expect(res.status.calledWith(HTTP_STATUS.NOT_FOUND)).to.be.true;
  });

  it('handles AuthError with 401 status', () => {
    const err = new AuthError();
    const res = buildRes();
    errorHandler(err, buildReq(), res, sinon.stub());
    expect(res.status.calledWith(HTTP_STATUS.UNAUTHORIZED)).to.be.true;
  });

  it('handles unknown errors with 500 status', () => {
    const err = new Error('Unexpected failure');
    const res = buildRes();
    errorHandler(err, buildReq(), res, sinon.stub());
    expect(res.status.calledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)).to.be.true;
  });

  it('handles malformed JSON SyntaxError with 400 status', () => {
    const err = new SyntaxError('Unexpected token');
    err.status = 400;
    err.body = true;
    const res = buildRes();
    errorHandler(err, buildReq(), res, sinon.stub());
    expect(res.status.calledWith(HTTP_STATUS.BAD_REQUEST)).to.be.true;
  });
});

// ── responseHandler helpers ───────────────────────────────────────────────────

describe('sendError()', () => {
  it('returns a standardised error envelope', () => {
    const res = buildRes();
    sendError(res, 'Not found', 404);
    const [body] = res.json.firstCall.args;
    expect(body.success).to.be.false;
    expect(body.message).to.equal('Not found');
    expect(body.error.code).to.equal(404);
    expect(body.timestamp).to.be.a('string');
  });
});
