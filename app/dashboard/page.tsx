import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  await requireUser();
  const db = await supabaseServer();

  // Get all properties
  const { data: properties } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  // Get all requests
  const { data: requests } = await db
    .from('requests')
    .select(`
      id, 
      title, 
      due_date, 
      property_id, 
      created_at,
      request_items(id, status)
    `)
    .order('created_at', { ascending: false });

  // Get all files for time saved calculation
  const { data: allFiles } = await db
    .from('files')
    .select('id, uploaded_at');

  // Calculate KPIs
  const totalProperties = properties?.length || 0;
  
  // Projects completed: requests where ALL items are received
  const completedRequests = requests?.filter((r) => {
    const items = r.request_items || [];
    return items.length > 0 && items.every((i) => i.status === 'received');
  }).length || 0;

  // In-progress: requests with at least 1 pending item
  const inProgressRequests = requests?.filter((r) => {
    const items = r.request_items || [];
    return items.some((i) => i.status === 'pending');
  }).length || 0;

  // Time saved: heuristic of 0.25 hours per received file
  const totalFiles = allFiles?.length || 0;
  const timeSaved = (totalFiles * 0.25).toFixed(1);

  // Get last 7 days of uploads for chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentUploads = allFiles?.filter(
    (f) => new Date(f.uploaded_at) >= sevenDaysAgo
  ) || [];

  // Group uploads by day
  const uploadsByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = recentUploads.filter(
      (f) => f.uploaded_at.split('T')[0] === dateStr
    ).length;
    return { date: dateStr, count };
  });

  const maxUploads = Math.max(...uploadsByDay.map((d) => d.count), 1);

  // Get recent requests (last 5)
  const recentRequests = requests?.slice(0, 5) || [];

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-fg-muted mt-1">Manage your properties and requests</p>
          </div>
          <div className="flex gap-2">
            <Link href="/app/activity">
              <Button variant="ghost">Activity Log</Button>
            </Link>
            <Link href="/app/properties">
              <Button>New Property</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat 
            label="Projects Completed" 
            value={String(completedRequests)} 
            hint={`${totalProperties} ${totalProperties === 1 ? 'property' : 'properties'} total`}
          />
          <Stat 
            label="In Progress" 
            value={String(inProgressRequests)} 
            hint={inProgressRequests > 0 ? `${inProgressRequests} ${inProgressRequests === 1 ? 'request' : 'requests'} pending` : undefined}
          />
          <Stat 
            label="Time Saved" 
            value={`${timeSaved} hrs`} 
            hint={`Est. ${totalFiles} ${totalFiles === 1 ? 'file' : 'files'} @ 0.25h each`}
          />
        </div>

        {/* 7-Day Uploads Chart */}
        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-4">Uploads (Last 7 Days)</h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {uploadsByDay.map((day, i) => {
                const height = maxUploads > 0 ? (day.count / maxUploads) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-chart2 to-chart1 rounded-t-lg transition-all"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                        title={`${day.count} upload${day.count === 1 ? '' : 's'}`}
                      />
                    </div>
                    <div className="text-xs text-fg-subtle text-center">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-fg-subtle text-center">
              Total: {recentUploads.length} upload{recentUploads.length === 1 ? '' : 's'} in the last 7 days
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Properties</h2>
            <Link href="/app/properties">
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties?.slice(0, 6).map(p => (
              <Link 
                key={p.id} 
                href={`/app/property/${p.id}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2 rounded-2xl"
              >
                <Card className="hover:bg-elev transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-fg-muted mt-1">{p.address || 'No address'}</div>
                  </CardContent>
                </Card>
              </Link>
            )) || <p className="text-fg-muted">No properties yet.</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Requests</h2>
          </div>
          {recentRequests.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.map(r => {
                const items = r.request_items || [];
                const received = items.filter(i => i.status === 'received').length;
                const total = items.length;
                
                return (
                  <Card key={r.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{r.title}</div>
                          <div className="text-sm text-fg-muted mt-1">
                            {r.due_date ? `Due: ${new Date(r.due_date).toLocaleDateString()}` : 'No due date'}
                          </div>
                        </div>
                        {total > 0 && (
                          <div className="text-sm font-mono">
                            {received}/{total}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-fg-muted">No requests yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

