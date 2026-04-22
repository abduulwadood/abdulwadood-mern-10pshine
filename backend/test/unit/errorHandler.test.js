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
});
