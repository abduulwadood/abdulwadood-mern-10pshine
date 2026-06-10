'use strict';

/**
 * @param {{ firstName: string, username: string, loginUrl: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateWelcomeEmailTemplate({ firstName, username, loginUrl }) {
  const displayName = firstName || username;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to PearlNotes</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">PearlNotes</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Welcome, ${displayName}!</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;">
                Your account has been verified and is ready to use. Start capturing your ideas, tasks, and thoughts in one place.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">Go to PearlNotes</a>
              </div>
              <p style="margin:0;font-size:14px;color:#6b7280;">
                Your username is <strong>${username}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} PearlNotes. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome, ${displayName}!\n\nYour PearlNotes account is ready. Log in at: ${loginUrl}\n\nYour username: ${username}\n\nPearlNotes`;

  return { subject: 'Welcome to PearlNotes!', html, text };
}

module.exports = { generateWelcomeEmailTemplate };
