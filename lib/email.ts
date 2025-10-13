import { Resend } from 'resend';
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendRequestEmail(to: string, subject: string, html: string) {
  if (!resend || !process.env.RESEND_FROM) {
    // No-op in preview/dev if not configured
    return;
  }
  await resend.emails.send({ from: process.env.RESEND_FROM, to, subject, html });
}

