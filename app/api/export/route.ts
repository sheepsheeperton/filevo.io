export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabase/server';
import archiver from 'archiver';
import { NextRequest } from 'next/server';
import { PassThrough } from 'stream';

type FileRow = {
  storage_path: string | null;
  request_item_id: string | null;
  request_item?: { request_id: string } | null;
  request?: { property_id: string } | null;
};

export async function GET(req: NextRequest) {
  const db = await supabaseServer();
  const url = new URL(req.url);
  const propertyId = url.searchParams.get('propertyId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  if (!propertyId) return new Response('Missing propertyId', { status: 400 });

  let query = db
    .from('files')
    .select(
      'storage_path, request_item_id, uploaded_at, request_item:request_items(request_id), request:requests(property_id)'
    );

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('uploaded_at', startDate);
  }
  if (endDate) {
    query = query.lte('uploaded_at', endDate);
  }

  const { data: rows, error } = await query.returns<FileRow[]>();

  if (error) return new Response(error.message, { status: 500 });

  const relevant = (rows || []).filter(
    (r) => r.request?.property_id === propertyId && !!r.storage_path
  );

  if (!relevant.length) return new Response('No files', { status: 404 });

  // Node stream → web Response
  const pass = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => pass.destroy(err));
  archive.pipe(pass);

  // Start building archive asynchronously
  (async () => {
    for (const row of relevant) {
      const path = row.storage_path as string;
      const { data, error: dlErr } = await db.storage.from('documents').download(path);
      if (!dlErr && data) {
        const buf = Buffer.from(await data.arrayBuffer());
        archive.append(buf, { name: path.split('/').slice(-1)[0] });
      }
    }
    await archive.finalize();
  })().catch((e) => pass.destroy(e));

  return new Response(pass as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="property-${propertyId}.zip"`,
    },
  });
}

