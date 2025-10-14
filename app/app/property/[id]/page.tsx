import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/button';
import { RequestForm } from '@/components/requests/RequestForm';
import Link from 'next/link';

export default async function PropertyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const db = await supabaseServer();

  // Get property stats
  const { data: requests } = await db
    .from('requests')
    .select(`
      id,
      title,
      description,
      due_date,
      created_at,
      request_items (
        id,
        tag,
        status
      )
    `)
    .eq('property_id', id)
    .order('created_at', { ascending: false });

  const { data: items } = await db
    .from('request_items')
    .select('id, status, request:requests!inner(property_id)')
    .eq('request.property_id', id);

  const { data: files } = await db
    .from('files')
    .select(`
      id,
      request_item:request_items!inner(
        request:requests!inner(property_id)
      )
    `)
    .eq('request_item.request.property_id', id);

  const totalRequests = requests?.length || 0;
  const totalItems = items?.length || 0;
  const pendingItems = items?.filter((i) => i.status === 'pending').length || 0;
  const receivedItems = items?.filter((i) => i.status === 'received').length || 0;
  const totalFiles = files?.length || 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Requests" value={String(totalRequests)} />
        <Stat
          label="Pending Items"
          value={String(pendingItems)}
          hint={totalItems > 0 ? `${receivedItems}/${totalItems} received` : undefined}
        />
        <Stat
          label="Completion Rate"
          value={totalItems > 0 ? `${Math.round((receivedItems / totalItems) * 100)}%` : '—'}
        />
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/app/property/${id}/requests`} className="flex-1">
          <Button className="w-full">New Request</Button>
        </Link>
        <Link href={`/app/property/${id}/files`} className="flex-1">
          <Button variant="secondary" className="w-full">
            View Files ({totalFiles})
          </Button>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Recent Requests</h2>
            <p className="text-sm text-fg-muted mt-1">
              Track document collection progress for this property
            </p>
          </div>
          {totalRequests > 3 && (
            <Link href={`/app/property/${id}/requests`}>
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          )}
        </div>

        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.slice(0, 3).map((request) => {
              const items = request.request_items || [];
              const received = items.filter(i => i.status === 'received').length;
              const total = items.length;
              const isComplete = total > 0 && received === total;
              
              return (
                <Card key={request.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{request.title}</h3>
                        {request.description && (
                          <p className="text-sm text-fg-muted mt-2">{request.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {request.due_date && (
                            <span className="text-fg-subtle">
                              Due: {new Date(request.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`font-mono ${isComplete ? 'text-success' : 'text-fg-subtle'}`}>
                            {received}/{total} received
                          </span>
                        </div>
                      </div>
                      <Link href={`/app/property/${id}/requests`}>
                        <Button size="sm" variant="ghost">
                          View Details →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="text-fg-muted">
                  <svg
                    className="mx-auto h-12 w-12 text-fg-subtle"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium">No requests yet</h3>
                  <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">
                    Create your first document request to start collecting files from tenants, contractors, or team members
                  </p>
                </div>
                <Link href={`/app/property/${id}/requests`}>
                  <Button>Create First Request</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

