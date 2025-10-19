import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const db = await supabaseServer();
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const itemId = form.get('itemId') as string;
  const token = form.get('token') as string;

  if (!file || !itemId || !token) return new Response('Bad Request', { status: 400 });

  // Validate token ↔ item linkage and check if request is archived
  const { data: item } = await db
    .from('request_items')
    .select(`
      id, 
      request_id, 
      tag, 
      upload_token,
      requests!inner(
        id,
        archived_at
      )
    `)
    .eq('id', itemId)
    .eq('upload_token', token)
    .single();
  
  if (!item) return new Response('Invalid token', { status: 401 });
  
  // Check if request is archived
  if (item.requests && Array.isArray(item.requests) && item.requests.length > 0 && item.requests[0].archived_at) {
    return new Response('Upload link expired', { status: 410 });
  }

  // Determine storage path
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `items/${item.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

  // Use service role to upload to storage
  const arrayBuf = await file.arrayBuffer();
  const { error: upErr } = await db.storage.from('documents').upload(path, new Uint8Array(arrayBuf), { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (upErr) return new Response(upErr.message, { status: 500 });

  // Insert file row + mark received
  const { error: insErr } = await db.from('files').insert({ request_item_id: item.id, file_name: file.name, storage_path: path }).select().single();
  if (insErr) return new Response(insErr.message, { status: 500 });

  await db.from('request_items').update({ status: 'received' }).eq('id', item.id);

  return Response.json({ ok: true, path });
}

