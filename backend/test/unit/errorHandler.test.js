'use strict';

const { expect } = require('chai');
const {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServerError,
  RateLimitError,
  ExternalServiceError,
  InvalidRequestError,
} = require('../../src/utils/customErrors');
const { HTTP_STATUS, ERROR_TYPES } = require('../../src/config/constants');

describe('Custom Error Classes', () => {
  describe('AppError (base)', () => {
    it('creates an error with the correct properties', () => {
      const err = new AppError('Something went wrong', 500, 'ServerError');
      expect(err.message).to.equal('Something went wrong');
      expect(err.statusCode).to.equal(500);
      expect(err.errorType).to.equal('ServerError');
      expect(err.isOperational).to.be.true;
      expect(err).to.be.instanceof(Error);
    });

    it('serialises to JSON correctly', () => {
      const err = new AppError('Test error', 400, 'ValidationError');
      const json = err.toJSON();
      expect(json).to.have.keys(['name', 'errorType', 'message', 'statusCode']);
      expect(json.statusCode).to.equal(400);
    });
  });

  describe('ValidationError', () => {
    it('has BAD_REQUEST status code', () => {
      const err = new ValidationError('Invalid input', ['field is required']);
      expect(err.statusCode).to.equal(HTTP_STATUS.BAD_REQUEST);
      expect(err.errorType).to.equal(ERROR_TYPES.VALIDATION);
    });

    it('includes details in JSON serialisation', () => {
      const details = ['email is invalid', 'password too short'];
      const err = new ValidationError('Validation failed', details);
      const json = err.toJSON();
      expect(json.details).to.deep.equal(details);
    });
  });

  describe('AuthError', () => {
    it('has UNAUTHORIZED status code', () => {
      const err = new AuthError();
      expect(err.statusCode).to.equal(HTTP_STATUS.UNAUTHORIZED);
    });

    it('uses the default message', () => {
      const err = new AuthError();
      expect(err.message).to.equal('Authentication required');
    });
  });

  describe('ForbiddenError', () => {
    it('has FORBIDDEN status code', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).to.equal(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe('NotFoundError', () => {
    it('has NOT_FOUND status code', () => {
      const err = new NotFoundError();
      expect(err.statusCode).to.equal(HTTP_STATUS.NOT_FOUND);
    });

    it('includes the resource name in the message', () => {
      const err = new NotFoundError('Note');
      expect(err.message).to.equal('Note not found');
    });
  });

  describe('ConflictError', () => {
    it('has CONFLICT status code', () => {
      const err = new ConflictError();
      expect(err.statusCode).to.equal(HTTP_STATUS.CONFLICT);
    });
  });

  describe('DatabaseError', () => {
    it('has INTERNAL_SERVER_ERROR status code', () => {
      const err = new DatabaseError();
      expect(err.statusCode).to.equal(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(err.errorType).to.equal(ERROR_TYPES.DATABASE);
    });

    it('stores the original error message but does not expose it via toJSON', () => {
      const original = new Error('ER_NO_SUCH_TABLE');
      const err = new DatabaseError('DB operation failed', original);
      expect(err.originalMessage).to.equal('ER_NO_SUCH_TABLE');
      // toJSON should NOT include originalMessage
      const json = err.toJSON();
      expect(json).to.not.have.property('originalMessage');
    });
  });

  describe('ServerError', () => {
    it('has INTERNAL_SERVER_ERROR status code', () => {
      const err = new ServerError();
      expect(err.statusCode).to.equal(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe('RateLimitError', () => {
    it('has TOO_MANY_REQUESTS status code', () => {
      const err = new RateLimitError();
      expect(err.statusCode).to.equal(HTTP_STATUS.TOO_MANY_REQUESTS);
    });

    it('stores retryAfter value', () => {
      const err = new RateLimitError('Slow down', 30);
      expect(err.retryAfter).to.equal(30);
    });

    it('includes retryAfter in JSON serialisation', () => {
      const err = new RateLimitError('Rate limited', 60);
      const json = err.toJSON();
      expect(json.retryAfter).to.equal(60);
    });

    it('uses a default retryAfter of 60', () => {
      const err = new RateLimitError();
      expect(err.retryAfter).to.equal(60);
    });
  });

  describe('ExternalServiceError', () => {
    it('has SERVICE_UNAVAILABLE status code', () => {
      const err = new ExternalServiceError('Email');
      expect(err.statusCode).to.equal(HTTP_STATUS.SERVICE_UNAVAILABLE);
    });

    it('stores the service name', () => {
      const err = new ExternalServiceError('Stripe');
      expect(err.service).to.equal('Stripe');
    });

    it('uses the provided message when given', () => {
      const err = new ExternalServiceError('Email', 'SMTP auth failed');
      expect(err.message).to.equal('SMTP auth failed');
    });

    it('generates a default message from service name', () => {
      const err = new ExternalServiceError('Payment Gateway');
      expect(err.message).to.include('Payment Gateway');
    });
  });

  describe('InvalidRequestError', () => {
    it('has BAD_REQUEST status code', () => {
      const err = new InvalidRequestError();
      expect(err.statusCode).to.equal(HTTP_STATUS.BAD_REQUEST);
    });

    it('stores the details field', () => {
      const err = new InvalidRequestError('Bad param', ['field x is wrong']);
      expect(err.details).to.deep.equal(['field x is wrong']);
    });

    it('includes details in JSON serialisation', () => {
      const err = new InvalidRequestError('Oops', ['reason A', 'reason B']);
      const json = err.toJSON();
      expect(json.details).to.deep.equal(['reason A', 'reason B']);
    });

    it('details is null when not provided', () => {
      const err = new InvalidRequestError('Oops');
      expect(err.details).to.be.null;
    });
  });
});
