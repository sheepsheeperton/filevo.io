import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Stat } from '@/components/ui/Stat';

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
    .select('id')
    .eq('property_id', id);

  const { data: items } = await db
    .from('request_items')
    .select('id, status, request:requests!inner(property_id)')
    .eq('request.property_id', id);

  const totalRequests = requests?.length || 0;
  const totalItems = items?.length || 0;
  const pendingItems = items?.filter((i) => i.status === 'pending').length || 0;
  const receivedItems = items?.filter((i) => i.status === 'received').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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

      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">Total Requests</span>
              <span className="font-medium">{totalRequests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Total Items Requested</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Items Pending</span>
              <span className="font-medium text-warning">{pendingItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Items Received</span>
              <span className="font-medium text-success">{receivedItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold mb-2">About This Property</h2>
          <p className="text-sm text-fg-muted">
            Use the tabs above to manage document requests, view uploaded files, and
            control access for team members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

