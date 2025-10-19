import { Resend } from 'resend';
import { getSignedDownloadUrl } from './storage';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

if (!process.env.RESEND_FROM) {
  throw new Error('RESEND_FROM environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  mime: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, text, attachments }: EmailOptions) {
  try {
    // Check if required environment variables are set
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      throw new Error('Resend configuration is missing. Please set RESEND_API_KEY and RESEND_FROM environment variables.');
    }

    const emailData: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
      attachments?: EmailAttachment[];
    } = {
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(emailData);

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

/**
 * Fetch request attachments and convert them to email attachments
 * Returns attachments if total size is under 20MB, otherwise returns signed download links
 */
export async function getRequestAttachmentsForEmail(requestId: string): Promise<{
  attachments: EmailAttachment[];
  downloadLinks: Array<{ filename: string; url: string; size: number }>;
}> {
  try {
    const { supabaseServer } = await import('./supabase/server');
    const db = await supabaseServer();

    // Fetch request attachments
    const { data: files, error } = await db
      .from('files')
      .select('file_name, storage_path, file_size, content_type')
      .eq('request_id', requestId)
      .eq('origin', 'request_attachment')
      .eq('tag', 'attachment');

    if (error) {
      console.error('Error fetching request attachments:', error);
      return { attachments: [], downloadLinks: [] };
    }

    if (!files || files.length === 0) {
      return { attachments: [], downloadLinks: [] };
    }

    const attachments: EmailAttachment[] = [];
    const downloadLinks: Array<{ filename: string; url: string; size: number }> = [];
    const maxTotalSize = 20 * 1024 * 1024; // 20MB
    let totalSize = 0;

    for (const file of files) {
      const fileSize = file.file_size || 0;
      
      // If adding this file would exceed the limit, add to download links instead
      if (totalSize + fileSize > maxTotalSize) {
        const downloadUrl = await getSignedDownloadUrl(file.storage_path);
        if (downloadUrl) {
          downloadLinks.push({
            filename: file.file_name,
            url: downloadUrl,
            size: fileSize
          });
        }
        continue;
      }

      try {
        // Generate signed download URL
        const downloadUrl = await getSignedDownloadUrl(file.storage_path);
        if (!downloadUrl) {
          console.error('Failed to generate download URL for:', file.file_name);
          continue;
        }

        // Fetch file content
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          console.error('Failed to fetch file:', file.file_name);
          continue;
        }

        const content = Buffer.from(await response.arrayBuffer());
        
        attachments.push({
          filename: file.file_name,
          content,
          mime: file.content_type || 'application/octet-stream'
        });

        totalSize += fileSize;
      } catch (error) {
        console.error('Error processing attachment:', file.file_name, error);
        // Fallback to download link
        const downloadUrl = await getSignedDownloadUrl(file.storage_path);
        if (downloadUrl) {
          downloadLinks.push({
            filename: file.file_name,
            url: downloadUrl,
            size: fileSize
          });
        }
      }
    }

    return { attachments, downloadLinks };
  } catch (error) {
    console.error('Error in getRequestAttachmentsForEmail:', error);
    return { attachments: [], downloadLinks: [] };
  }
}
