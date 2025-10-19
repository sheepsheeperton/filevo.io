import { supabaseServer } from '@/lib/supabase/server';
import { getSignedUploadUrl, getSignedUploadUrlForRequestAttachment } from '@/lib/storage';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { propertyId, tag, fileName, itemId, token, requestId, contentType, size, origin } = await req.json();

    console.log('Upload URL request:', { propertyId, tag, fileName, itemId, token, requestId, contentType, size, origin });

    // Handle request attachments (manager uploads)
    if (origin === 'request_attachment') {
      if (!requestId || !fileName || !contentType || !size) {
        console.error('Missing required fields for request attachment:', { requestId, fileName, contentType, size });
        return new Response('Missing required fields', { status: 400 });
      }

      // Validate manager ownership of the request
      const db = await supabaseServer();
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

      // Validate file type and size
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(contentType)) {
        console.error('Invalid file type:', contentType);
        return new Response('Invalid file type', { status: 400 });
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (size > maxSize) {
        console.error('File too large:', size);
        return new Response('File too large (max 10MB)', { status: 400 });
      }

      // Generate signed upload URL for request attachment
      console.log('Generating signed upload URL for request attachment...');
      const result = await getSignedUploadUrlForRequestAttachment({ requestId, fileName });

      console.log('Signed upload URL result:', result);

      if (!result) {
        console.error('Failed to generate upload URL');
        return new Response('Failed to generate upload URL', { status: 500 });
      }

      return Response.json({
        signedUrl: result.signedUrl,
        path: result.path,
      });
    }

    // Handle regular item uploads (recipient uploads)
    if (!propertyId || !tag || !fileName || !itemId || !token) {
      console.error('Missing required fields:', { propertyId, tag, fileName, itemId, token });
      return new Response('Missing required fields', { status: 400 });
    }

    // Validate token
    const db = await supabaseServer();
    const { data: item, error: itemError } = await db
      .from('request_items')
      .select('id')
      .eq('id', itemId)
      .eq('upload_token', token)
      .single();

    console.log('Token validation result:', { item, itemError });

    if (!item) {
      console.error('Invalid token - item not found');
      return new Response('Invalid token', { status: 401 });
    }

    // Generate signed upload URL
    console.log('Generating signed upload URL...');
    const result = await getSignedUploadUrl({ propertyId, tag, fileName });

    console.log('Signed upload URL result:', result);

    if (!result) {
      console.error('Failed to generate upload URL');
      return new Response('Failed to generate upload URL', { status: 500 });
    }

    return Response.json({
      signedUrl: result.signedUrl,
      path: result.path,
    });
  } catch (error) {
    console.error('Error in get-url:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

