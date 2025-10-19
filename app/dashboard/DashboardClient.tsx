"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/KpiCard';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface RequestItem {
  id: string;
  status: string;
  tag: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  property_id: string | null;
  created_at: string;
  request_items: RequestItem[];
}

interface File {
  id: string;
  uploaded_at: string;
}

interface DashboardClientProps {
  properties: Property[];
  requests: Request[];
  allFiles: File[];
}

export function DashboardClient({ properties, requests, allFiles }: DashboardClientProps) {
  // Calculate KPIs for all requests
  const today = new Date();
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(today.getDate() + 5);

  const overdueRequests = requests.filter((r) => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    const items = r.request_items || [];
    return dueDate < today && items.some((i) => i.status === 'pending');
  }).length;

  const upcomingDeadlines = requests.filter((r) => {
    if (!r.due_date) return false;
    const dueDate = new Date(r.due_date);
    return dueDate >= today && dueDate <= fiveDaysFromNow;
  }).length;

  const pendingDocuments = requests.reduce((total, r) => {
    const items = r.request_items || [];
    return total + items.filter((i) => i.status === 'pending').length;
  }, 0);

  const completedRequests = requests.filter((r) => {
    const items = r.request_items || [];
    return items.length > 0 && items.every((i) => i.status === 'received');
  }).length;

  const inProgressRequests = requests.filter((r) => {
    const items = r.request_items || [];
    return items.some((i) => i.status === 'pending');
  }).length;

  // Get recent uploads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentUploads = allFiles.filter(
    (f) => new Date(f.uploaded_at) >= sevenDaysAgo
  );

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
  const recentRequests = requests.slice(0, 5);

  return (
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
        <KpiCard
          title="Overdue Requests"
          count={overdueRequests}
          description={overdueRequests === 0 ? 'All requests on track' : `${overdueRequests} ${overdueRequests === 1 ? 'request' : 'requests'} past due`}
          helperText="Requests past their due date with pending documents"
          color="red"
          href="/app/properties"
        />

        <KpiCard
          title="Upcoming Deadlines"
          count={upcomingDeadlines}
          description={upcomingDeadlines === 0 ? 'No deadlines this week' : 'Due within 5 days'}
          helperText="Requests with deadlines approaching soon"
          color="orange"
          href="/app/properties"
        />

        <KpiCard
          title="Pending Documents"
          count={pendingDocuments}
          description={pendingDocuments === 0 ? 'All documents received' : `${pendingDocuments} ${pendingDocuments === 1 ? 'document' : 'documents'} outstanding`}
          helperText="Outstanding required items across requests"
          color="orange"
          href="/app/properties"
        />

        <KpiCard
          title="Requests Completed"
          count={completedRequests}
          description={completedRequests === 0 ? 'No completed requests yet' : `${completedRequests} ${completedRequests === 1 ? 'request' : 'requests'} finished`}
          helperText="Document requests where all items have been received"
          color="green"
          href="/app/properties"
        />

        <KpiCard
          title="In Progress"
          count={inProgressRequests}
          description={inProgressRequests === 0 ? 'No active requests' : `${inProgressRequests} ${inProgressRequests === 1 ? 'request' : 'requests'} active`}
          helperText="Active requests with at least one pending item"
          color="blue"
          href="/app/properties"
        />

        <KpiCard
          title="Recent Uploads"
          count={recentUploads.length}
          description={recentUploads.length === 0 ? 'No uploads this week' : 'In the last 7 days'}
          helperText="Files uploaded in the past week"
          color="green"
          href="/app/activity"
        />
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
  );
}
