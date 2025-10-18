import { supabaseServer } from '@/lib/supabase/server';
import UploadForm from './upload-form';
import Logo from '@/components/brand/Logo';

export default async function PublicUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await supabaseServer();
  
  console.log('Looking up token:', token);
  
  // First, get the request item
  const { data: item, error } = await db
    .from('request_items')
    .select(`
      id,
      tag,
      status,
      upload_token,
      request_id
    `)
    .eq('upload_token', token)
    .single();

  console.log('Query result:', { item, error });

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-bg">
        <div className="max-w-md text-center space-y-4">
          <div className="text-danger">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Invalid Upload Link</h1>
          <p className="text-fg-muted">This upload link is not valid or has expired. Please contact the property manager for assistance.</p>
        </div>
      </main>
    );
  }

  // Get request details
  const { data: request } = await db
    .from('requests')
    .select(`
      id,
      title,
      description,
      due_date,
      property_id
    `)
    .eq('id', item.request_id)
    .single();

  // Get property details
  const { data: property } = await db
    .from('properties')
    .select(`
      id,
      name
    `)
    .eq('id', request?.property_id)
    .single();

  if (!request || !property) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-bg">
        <div className="max-w-md text-center space-y-4">
          <div className="text-danger">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Invalid Upload Link</h1>
          <p className="text-fg-muted">This upload link is not valid or has expired. Please contact the property manager for assistance.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Logo variant="full" />
          {item.status === 'received' && (
            <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full border border-success/20">
              ✓ Received
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Upload Document</h1>
          <p className="text-fg-muted">
            Property: {property.name} · Request: {request.title}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{item.tag}</h2>
            {request.description && (
              <p className="text-sm text-fg-muted">{request.description}</p>
            )}
            {request.due_date && (
              <p className="text-sm text-fg-subtle mt-2">
                Due: {new Date(request.due_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <UploadForm itemId={item.id} token={token} propertyId={property.id} tag={item.tag} />
        </div>

        <div className="text-center text-sm text-fg-subtle">
          <p>Powered by Filevo · Secure document collection for property managers</p>
        </div>
      </div>
    </main>
  );
}