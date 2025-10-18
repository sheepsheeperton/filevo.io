export const runtime = 'nodejs';

import { supabaseServer } from '@/lib/supabase/server';
import archiver from 'archiver';
import { NextRequest } from 'next/server';
import { PassThrough } from 'stream';

type FileRow = {
  storage_path: string | null;
  request_item_id: string | null;
  uploaded_at: string;
};

export async function GET(req: NextRequest) {
  const db = await supabaseServer();
  const url = new URL(req.url);
  const propertyId = url.searchParams.get('propertyId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  if (!propertyId) return new Response('Missing propertyId', { status: 400 });

  // First get all request items for this property
  const { data: requestItems, error: requestItemsError } = await db
    .from('request_items')
    .select(`
      id,
      request:requests!inner(
        property_id
      )
    `)
    .eq('request.property_id', propertyId);

  if (requestItemsError) {
    console.error('Error fetching request items:', requestItemsError);
    return new Response(requestItemsError.message, { status: 500 });
  }

  if (!requestItems || requestItems.length === 0) {
    return new Response('No files found for this property', { status: 404 });
  }

  const requestItemIds = requestItems.map(item => item.id);

  // Now get files for these request items
  let query = db
    .from('files')
    .select('storage_path, request_item_id, uploaded_at')
    .in('request_item_id', requestItemIds);

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('uploaded_at', startDate);
  }
  if (endDate) {
    query = query.lte('uploaded_at', endDate);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error('Error fetching files:', error);
    return new Response(error.message, { status: 500 });
  }

  const relevant = (rows || []).filter(r => !!r.storage_path);

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

