'use strict';

module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
};
