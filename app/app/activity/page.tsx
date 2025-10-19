import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { ActivityClient } from './ActivityClient';

export default async function ActivityPage() {
  await requireUser();
  const db = await supabaseServer();

  const { data: activities } = await db
    .from('activity_logs')
    .select('id, action, entity, entity_id, created_at, actor')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get requests for category inference
  const { data: requests } = await db
    .from('requests')
    .select(`
      id, 
      title, 
      description,
      due_date, 
      property_id, 
      created_at,
      archived_at,
      request_items(id, status, tag)
    `)
    .is('archived_at', null) // Exclude archived requests
    .order('created_at', { ascending: false });

  return (
    <AppShell>
      <ActivityClient 
        activities={activities || []}
        requests={requests || []}
      />
    </AppShell>
  );
}

