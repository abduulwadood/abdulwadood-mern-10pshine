'use strict';

/**
 * Stub — will be implemented in a future module.
 * @param {{ firstName: string, username: string, resetToken: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
function generatePasswordResetEmailTemplate({ firstName, username }) {
  const displayName = firstName || username;
  return {
    subject: 'Reset your PearlNotes password',
    html: `<p>Hi ${displayName}, password reset coming soon.</p>`,
    text: `Hi ${displayName}, password reset coming soon.`,
  };
}

module.exports = { generatePasswordResetEmailTemplate };
