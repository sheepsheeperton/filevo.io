import { supabaseServer } from '@/lib/supabase/server';
import { sendRequestEmail } from '@/lib/email';
import { requestReminderEmail } from '@/lib/email/templates/request-reminder';

export async function GET() {
  const db = await supabaseServer();
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find items that are:
  // - pending
  // - due within 48 hours
  // - haven't been reminded in the last 24 hours (or never reminded)
  const { data: dueItems, error } = await db
    .from('request_items')
    .select(`
      id,
      tag,
      status,
      upload_token,
      last_reminder_at,
      request:requests!inner(
        id,
        title,
        due_date,
        property:properties!inner(
          id,
          name
        )
      )
    `)
    .eq('status', 'pending')
    .not('upload_token', 'is', null)
    .or(`last_reminder_at.is.null,last_reminder_at.lt.${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}`);

  if (error) {
    console.error('Error fetching due items:', error);
    return new Response(error.message, { status: 500 });
  }

  if (!dueItems?.length) {
    return Response.json({ ok: true, message: 'No reminders to send', count: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let sentCount = 0;

  for (const item of dueItems) {
    try {
      const request = Array.isArray(item.request) ? item.request[0] : item.request;
      const property = Array.isArray(request.property) ? request.property[0] : request.property;
      
      // Check if due within 48 hours
      if (request.due_date) {
        const dueDate = new Date(request.due_date);
        if (dueDate > twoDaysFromNow) {
          continue; // Skip if not due soon
        }
      }

      const uploadLink = `${baseUrl}/r/${item.upload_token}`;
      
      const html = requestReminderEmail({
        propertyName: property.name,
        tag: item.tag,
        uploadLink,
        dueDate: request.due_date,
      });

      await sendRequestEmail(
        'manager@filevo.io', // TODO: Replace with actual recipient email
        `Reminder: ${item.tag} - ${property.name}`,
        html
      );

      // Update last_reminder_at
      await db
        .from('request_items')
        .update({ last_reminder_at: now.toISOString() })
        .eq('id', item.id);

      sentCount++;
    } catch (err) {
      console.error(`Failed to send reminder for item ${item.id}:`, err);
    }
  }

  return Response.json({ 
    ok: true, 
    message: `Sent ${sentCount} reminder(s)`, 
    count: sentCount 
  });
}

