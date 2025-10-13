import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { ActivityList } from '@/components/activity/ActivityList';

export default async function ActivityPage() {
  await requireUser();
  const db = await supabaseServer();

  const { data: activities } = await db
    .from('activity_logs')
    .select('id, action, entity, entity_id, created_at, actor')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div>
          <h1 className="text-3xl font-semibold">Activity Log</h1>
          <p className="text-fg-muted mt-1">Recent actions and events</p>
        </div>

        <ActivityList activities={activities || []} />
      </div>
    </AppShell>
  );
}

