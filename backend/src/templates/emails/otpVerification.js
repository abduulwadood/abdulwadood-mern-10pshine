'use strict';

/**
 * @param {{ firstName: string, username: string, otp: string, expiresInMinutes: number }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
function generateOTPEmailTemplate({ firstName, username, otp, expiresInMinutes }) {
  const displayName = firstName || username;
  const displayOTP = `${otp.slice(0, 3)}-${otp.slice(3)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
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
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi ${displayName},</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;">
                Use the verification code below to confirm your email address.
                This code expires in <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <span style="display:inline-block;background:#f3f4f6;border:2px dashed #4f46e5;border-radius:8px;padding:16px 32px;font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;">${displayOTP}</span>
              </div>
              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                If you did not request this code, you can safely ignore this email.
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

  const text = `Hi ${displayName},\n\nYour verification code is: ${displayOTP}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this email.\n\nPearlNotes`;

  return { subject: 'Verify your email address', html, text };
}

module.exports = { generateOTPEmailTemplate };
