import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  await requireUser();
  const db = await supabaseServer();

  const { data: properties } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  const { data: recentRequests } = await db
    .from('requests')
    .select('id, title, due_date, property_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-fg-muted mt-1">Manage your properties and requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost">Export</Button>
            <Button>New Property</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Properties" value={String(properties?.length || 0)} />
          <Stat label="Recent Requests" value={String(recentRequests?.length || 0)} />
          <Stat label="Pending" value="—" hint="Coming soon" />
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Properties</h2>
            <Button size="sm" variant="ghost">View All</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties?.map(p => (
              <a 
                key={p.id} 
                href={`/property/${p.id}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2 rounded-2xl"
              >
                <Card className="hover:bg-elev transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-fg-muted mt-1">{p.address || '—'}</div>
                  </CardContent>
                </Card>
              </a>
            )) || <p className="text-fg-muted">No properties yet.</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Requests</h2>
            <Button size="sm" variant="ghost">View All</Button>
          </div>
          <div className="space-y-2">
            {recentRequests?.map(r => (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-fg-muted mt-1">Due: {r.due_date || '—'}</div>
                </CardContent>
              </Card>
            )) || <p className="text-fg-muted">No requests yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

