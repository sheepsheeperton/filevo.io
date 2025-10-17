import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

if (!process.env.RESEND_FROM) {
  throw new Error('RESEND_FROM environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // Check if required environment variables are set
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      throw new Error('Resend configuration is missing. Please set RESEND_API_KEY and RESEND_FROM environment variables.');
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const subject = 'Reset your Filevo password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
        <h1 style="color: #ff6b35; margin-bottom: 20px;">Filevo</h1>
        <h2 style="color: #333; margin-bottom: 20px;">Reset your password</h2>
        <p style="margin-bottom: 30px;">Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #ff6b35; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

export async function sendSignUpConfirmationEmail(email: string, confirmationLink: string) {
  const subject = 'Confirm your Filevo account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm your account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
        <h1 style="color: #ff6b35; margin-bottom: 20px;">Welcome to Filevo!</h1>
        <h2 style="color: #333; margin-bottom: 20px;">Confirm your account</h2>
        <p style="margin-bottom: 30px;">Click the button below to confirm your email address and activate your account:</p>
        <a href="${confirmationLink}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Account</a>
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${confirmationLink}" style="color: #ff6b35; word-break: break-all;">${confirmationLink}</a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This link will expire in 24 hours. If you didn't create this account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
