import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
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

  // Get all requests with detailed information
  const { data: requests } = await db
    .from('requests')
    .select(`
      id, 
      title, 
      due_date, 
      property_id, 
      created_at,
      request_items(id, status, tag)
    `)
    .order('created_at', { ascending: false });

  // Get all files for time saved calculation
  const { data: allFiles } = await db
    .from('files')
    .select('id, uploaded_at');

  // Calculate Property Manager KPIs
  const today = new Date();
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(today.getDate() + 5);
  
  // Overdue Requests: requests past their due date with pending items
  const overdueRequests = requests?.filter((r) => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    const items = r.request_items || [];
    return dueDate < today && items.some((i) => i.status === 'pending');
  }).length || 0;

  // Upcoming Deadlines: requests due within next 5 days
  const upcomingDeadlines = requests?.filter((r) => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    return dueDate >= today && dueDate <= fiveDaysFromNow;
  }).length || 0;

  // Pending Documents: total outstanding required items across all requests
  const pendingDocuments = requests?.reduce((total, r) => {
    const items = r.request_items || [];
    return total + items.filter((i) => i.status === 'pending').length;
  }, 0) || 0;

  // Requests Completed: requests where ALL items are received
  const completedRequests = requests?.filter((r) => {
    const items = r.request_items || [];
    return items.length > 0 && items.every((i) => i.status === 'received');
  }).length || 0;

  // In Progress: requests with at least 1 pending item
  const inProgressRequests = requests?.filter((r) => {
    const items = r.request_items || [];
    return items.some((i) => i.status === 'pending');
  }).length || 0;

  // Recent Uploads: files uploaded in last 7 days

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
      <div className="max-w-6xl space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-fg-muted mt-2">Monitor your properties, deadlines, and document collection progress</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overdue Requests - Red */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">Overdue Requests</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-red-500">{overdueRequests}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {overdueRequests === 0 ? 'All requests on track' : `${overdueRequests} ${overdueRequests === 1 ? 'request' : 'requests'} past due`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Requests past their due date with pending documents
            </div>
          </div>

          {/* Upcoming Deadlines - Orange */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">Upcoming Deadlines</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-orange-500">{upcomingDeadlines}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {upcomingDeadlines === 0 ? 'No deadlines this week' : `Due within 5 days`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Requests with deadlines approaching soon
            </div>
          </div>

          {/* Pending Documents - Orange */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">Pending Documents</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-orange-500">{pendingDocuments}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {pendingDocuments === 0 ? 'All documents received' : `${pendingDocuments} ${pendingDocuments === 1 ? 'document' : 'documents'} outstanding`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Total outstanding required items across all requests
            </div>
          </div>

          {/* Requests Completed - Green */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">Requests Completed</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-green-500">{completedRequests}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {completedRequests === 0 ? 'No completed requests yet' : `${completedRequests} ${completedRequests === 1 ? 'request' : 'requests'} finished`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Document requests where all items have been received
            </div>
          </div>

          {/* In Progress - Blue */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">In Progress</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-blue-500">{inProgressRequests}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {inProgressRequests === 0 ? 'No active requests' : `${inProgressRequests} ${inProgressRequests === 1 ? 'request' : 'requests'} active`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Active requests with at least one pending item
            </div>
          </div>

          {/* Recent Uploads - Green */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm text-fg-subtle">Recent Uploads</div>
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-green-500">{recentUploads.length}</div>
            <div className="mt-2 text-xs text-fg-muted">
              {recentUploads.length === 0 ? 'No uploads this week' : `In the last 7 days`}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
              Files uploaded in the past week
            </div>
          </div>
        </div>

        {/* 7-Day Uploads Chart */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold mb-1">Recent Upload Activity</h2>
            <p className="text-xs text-fg-muted mb-6">Daily file uploads over the past week</p>
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Properties</h2>
              <p className="text-sm text-fg-muted mt-1">Your most recently added properties</p>
            </div>
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
                <Card className="hover:bg-elev transition-colors cursor-pointer h-full">
                  <CardContent>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-fg-muted mt-2">{p.address || 'No address'}</div>
                  </CardContent>
                </Card>
              </Link>
            )) || <p className="text-fg-muted">No properties yet.</p>}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Recent Requests</h2>
            <p className="text-sm text-fg-muted mt-1">Latest document requests and their completion status</p>
          </div>
          {recentRequests.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.map(r => {
                const items = r.request_items || [];
                const received = items.filter(i => i.status === 'received').length;
                const total = items.length;
                
                return (
                  <Card key={r.id}>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{r.title}</div>
                          <div className="text-sm text-fg-muted mt-1">
                            {r.due_date ? `Due: ${new Date(r.due_date).toLocaleDateString()}` : 'No due date'}
                          </div>
                        </div>
                        {total > 0 && (
                          <div className="text-sm font-mono text-fg-subtle">
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
            <Card>
              <CardContent>
                <p className="text-fg-muted text-center">No requests yet. Create your first property to get started.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}

