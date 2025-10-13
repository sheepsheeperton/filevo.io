import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendRequestEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({ from: process.env.RESEND_FROM!, to, subject, html });
}

