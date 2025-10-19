import { supabaseServer } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { NextRequest } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const path = searchParams.get('path');

    console.log('Delete file request:', { requestId, path });

    if (!requestId || !path) {
      console.error('Missing required parameters:', { requestId, path });
      return new Response('Missing required parameters', { status: 400 });
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

    // Find the file record
    const { data: file, error: fileError } = await db
      .from('files')
      .select('id, storage_path, file_name')
      .eq('request_id', requestId)
      .eq('storage_path', path)
      .eq('origin', 'request_attachment')
      .single();

    if (!file || fileError) {
      console.error('File not found:', fileError);
      return new Response('File not found', { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await db.storage
      .from('files')
      .remove([path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: deleteError } = await db
      .from('files')
      .delete()
      .eq('id', file.id);

    if (deleteError) {
      console.error('Error deleting file record:', deleteError);
      return new Response('Failed to delete file', { status: 500 });
    }

    // Log activity
    await logActivity({
      actor: (await req.headers.get('x-user-id')) || '00000000-0000-0000-0000-000000000000',
      action: 'request_attachment_deleted',
      entity: 'file',
      entity_id: file.id,
    });

    console.log('File deleted successfully:', file);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in delete file:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
