import { supabaseServer } from '@/lib/supabase/server';
import UploadForm from './upload-form';

export default async function PublicUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseServer();
  const { data: item } = await db
    .from('request_items')
    .select('id, tag, request_id, status')
    .eq('upload_token', token)
    .single();

  if (!item) {
    return <main className="p-8"><h1 className="text-xl font-semibold">Invalid link</h1><p>This upload link is not valid.</p></main>;
  }

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Upload: {item.tag}</h1>
      <UploadForm itemId={item.id} token={token} />
    </main>
  );
}

