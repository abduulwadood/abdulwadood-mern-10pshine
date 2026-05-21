'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

/**
 * Verify the SMTP connection. Returns true on success, false on failure.
 * @returns {Promise<boolean>}
 */
async function verifyEmailConnection() {
  try {
    await getTransporter().verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (err) {
    logger.warn({ error: err.message }, 'Email transporter verification failed');
    return false;
  }
}

module.exports = { getTransporter, verifyEmailConnection };
