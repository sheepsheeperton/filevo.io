import { supabaseServer } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { itemId, token, fileName, storagePath, requestId, tag, origin, contentType, fileSize } = await req.json();

    console.log('Record upload request:', { itemId, token, fileName, storagePath, requestId, tag, origin, contentType, fileSize });

    // Handle request attachments (manager uploads)
    if (origin === 'request_attachment') {
      if (!requestId || !fileName || !storagePath) {
        console.error('Missing required fields for request attachment:', { requestId, fileName, storagePath });
        return new Response('Missing required fields', { status: 400 });
      }

      const db = await supabaseServer();

      // Validate manager ownership of the request
      const { data: request, error: requestError } = await db
        .from('requests')
        .select(`
          id,
          property_id,
          properties!inner(
            id,
            property_users!inner(user_id)
          )
        `)
        .eq('id', requestId)
        .eq('properties.property_users.user_id', (await req.headers.get('x-user-id')) || '')
        .single();

      if (!request || requestError) {
        console.error('Request not found or unauthorized:', requestError);
        return new Response('Request not found or unauthorized', { status: 401 });
      }

      // Insert file record for request attachment
      const { data: file, error: fileError } = await db
        .from('files')
        .insert({
          request_id: requestId,
          request_item_id: null,
          file_name: fileName,
          storage_path: storagePath,
          uploaded_by: (await req.headers.get('x-user-id')) || null,
          origin: 'request_attachment',
          tag: tag || 'attachment',
          content_type: contentType,
          file_size: fileSize,
        })
        .select()
        .single();

      if (fileError) {
        console.error('Error inserting request attachment:', fileError);
        return new Response('Failed to record file', { status: 500 });
      }

      // Log activity
      await logActivity({
        actor: (await req.headers.get('x-user-id')) || '00000000-0000-0000-0000-000000000000',
        action: 'request_attachment_uploaded',
        entity: 'file',
        entity_id: file.id,
      });

      console.log('Request attachment recorded successfully:', file);
      return Response.json({ success: true, file });
    }

    // Handle regular item uploads (recipient uploads)
    if (!itemId || !token || !fileName || !storagePath) {
      console.error('Missing required fields for item upload:', { itemId, token, fileName, storagePath });
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
      console.error('Invalid token - item not found');
      return new Response('Invalid token', { status: 401 });
    }

    // Insert file record
    const { data: file, error: fileError } = await db
      .from('files')
      .insert({
        request_item_id: itemId,
        request_id: item.request_id,
        file_name: fileName,
        storage_path: storagePath,
        uploaded_by: null, // Public upload, no user
        origin: 'item_upload',
        tag: 'document',
        content_type: contentType,
        file_size: fileSize,
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

    console.log('Item upload recorded successfully:', file);
    return Response.json({ success: true, file });
  } catch (error) {
    console.error('Error in record:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

