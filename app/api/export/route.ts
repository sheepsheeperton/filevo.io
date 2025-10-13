import { supabaseServer } from '@/lib/supabase/server';
import archiver from 'archiver';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const db = supabaseServer();
  const propertyId = new URL(req.url).searchParams.get('propertyId');
  if (!propertyId) return new Response('Missing propertyId', { status: 400 });

  // find file storage paths via joins
  const { data: rows, error } = await db
    .from('files')
    .select('storage_path, request_item_id, request_item:request_items(request_id), request:requests(property_id)')
    .neq('storage_path', null);

  if (error) return new Response(error.message, { status: 500 });

  const relevant = (rows || []).filter(r => (r as any).request?.property_id === propertyId);
  if (!relevant.length) return new Response('No files', { status: 404 });

  // streaming zip
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const archive = archiver('zip', { zlib: { level: 9 } });

  const stream = new WritableStream({
    write(chunk) { return writer.write(chunk); },
    close() { return writer.close(); },
    abort(err) { writer.abort(err); }
  });

  archive.on('error', err => writer.abort(err));
  archive.pipe(stream as any);

  for (const row of relevant) {
    const path = (row as any).storage_path as string;
    const { data } = await db.storage.from('documents').download(path);
    if (data) {
      const buf = Buffer.from(await data.arrayBuffer());
      archive.append(buf, { name: path.split('/').slice(-1)[0] });
    }
  }
  await archive.finalize();

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="property-${propertyId}.zip"`
    }
  });
}

