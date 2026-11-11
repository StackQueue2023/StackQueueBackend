/**
 * Centralized Branding Configuration for STACK QUEUE
 * Single source of truth for application branding, email sender metadata, and legal notices.
 */

const APP_NAME = process.env.APP_NAME || 'STACK QUEUE';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'STACK QUEUE';
const EMAIL_FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || 'stackqueue2023@gmail.com';

module.exports = {
  APP_NAME,
  EMAIL_FROM_NAME,
  EMAIL_FROM_ADDRESS,
  COMPANY_NAME: 'Stack Queue Technologies Inc.',
  SUPPORT_EMAIL: 'stackqueue2023@gmail.com',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TAGLINE: 'Inclusive Learning — Educational Training & Product Development',

  // Standard nodemailer 'from' object
  getDefaultSender: () => ({
    name: EMAIL_FROM_NAME,
    address: EMAIL_FROM_ADDRESS
  }),

  // Standard formatted sender string (e.g. '"STACK QUEUE" <stackqueue2023@gmail.com>')
  getSenderString: (customPrefix = '') => {
    const displayName = customPrefix ? `${EMAIL_FROM_NAME} ${customPrefix}`.trim() : EMAIL_FROM_NAME;
    return `"${displayName}" <${EMAIL_FROM_ADDRESS}>`;
  },

  // Standard Email Header HTML
  getEmailHeaderHtml: (subtitle = 'Inclusive Learning Platform') => `
    <div style="text-align: center; border-bottom: 2px solid #8B2BE2; padding-bottom: 16px; margin-bottom: 24px;">
      <h2 style="color: #8B2BE2; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px;">${APP_NAME}</h2>
      <p style="color: #64748b; font-size: 12px; margin-top: 4px; margin-bottom: 0;">${subtitle}</p>
    </div>
  `,

  // Standard Email Footer HTML
  getEmailFooterHtml: () => `
    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
      <p style="margin: 0 0 4px 0;">This email was sent by <strong>${APP_NAME}</strong>.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${APP_NAME} Technologies Inc. All rights reserved.</p>
    </div>
  `
};
