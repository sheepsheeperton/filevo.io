import { supabaseServer } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { itemId, token, fileName, storagePath } = await req.json();

    if (!itemId || !token || !fileName || !storagePath) {
      return new Response('Missing required fields', { status: 400 });
    }

    const db = await supabaseServer();

    // Validate token
    const { data: item } = await db
      .from('request_items')
      .select('id, request_id')
      .eq('id', itemId)
      .eq('upload_token', token)
      .single();

    if (!item) {
      return new Response('Invalid token', { status: 401 });
    }

    // Insert file record
    const { data: file, error: fileError } = await db
      .from('files')
      .insert({
        request_item_id: itemId,
        file_name: fileName,
        storage_path: storagePath,
        uploaded_by: null, // Public upload, no user
      })
      .select()
      .single();

    if (fileError) {
      console.error('Error inserting file:', fileError);
      return new Response('Failed to record file', { status: 500 });
    }

    // Update request_item status to received
    await db
      .from('request_items')
      .update({ status: 'received' })
      .eq('id', itemId);

    // Log activity (no actor for public uploads)
    await logActivity({
      actor: '00000000-0000-0000-0000-000000000000', // System/public
      action: 'uploaded',
      entity: 'file',
      entity_id: file.id,
    });

    return Response.json({ success: true, file });
  } catch (error) {
    console.error('Error in record:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

