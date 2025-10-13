import { supabaseServer } from '@/lib/supabase/server';
import { sendRequestEmail } from '@/lib/email';

export async function GET() {
  const db = await supabaseServer();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000).toISOString();

  const { data: due, error } = await db
    .from('request_items')
    .select('id, tag, status, request_id')
    .eq('status', 'pending')
    .lte('created_at', tomorrow);

  if (error) return new Response(error.message, { status: 500 });
  if (!due?.length) return Response.json({ ok: true, msg: 'No reminders' });

  for (const item of due) {
    await sendRequestEmail('manager@filevo.io', 'Reminder: item pending', `<p>${item.tag}</p>`);
    await db.from('request_items').update({ last_reminder_at: new Date().toISOString() }).eq('id', item.id);
  }

  return Response.json({ ok: true, count: due.length });
}

