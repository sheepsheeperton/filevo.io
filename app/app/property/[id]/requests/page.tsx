import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyRequestForm } from '@/components/requests/PropertyRequestForm';
import { RequestCard } from '@/components/requests/RequestCard';

export default async function PropertyRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const db = await supabaseServer();

  const { data: requests, error: requestsError } = await db
    .from('requests')
    .select(`
      id,
      title,
      description,
      due_date,
      created_at,
      archived_at,
      recipient_name,
      recipient_email,
      recipient_phone,
      notify_pref,
      notified_at,
      request_items (
        id,
        tag,
        status,
        upload_token
      )
    `)
    .eq('property_id', id)
    .is('archived_at', null) // Exclude archived requests by default
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Document Requests</h2>
        <PropertyRequestForm propertyId={id} />
      </div>

      {requestsError && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-danger">
              <p>Error loading requests: {requestsError.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} propertyId={id} />
          ))}
        </div>
      ) : !requestsError && (
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
                  Create your first document request to send upload links and track file submissions
                </p>
              </div>
              <PropertyRequestForm propertyId={id} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

