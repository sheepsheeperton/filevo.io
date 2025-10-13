import { supabaseServer } from '@/lib/supabase/server';
import { getSignedUploadUrl } from '@/lib/storage';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { propertyId, tag, fileName, itemId, token } = await req.json();

    if (!propertyId || !tag || !fileName || !itemId || !token) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Validate token
    const db = await supabaseServer();
    const { data: item } = await db
      .from('request_items')
      .select('id')
      .eq('id', itemId)
      .eq('upload_token', token)
      .single();

    if (!item) {
      return new Response('Invalid token', { status: 401 });
    }

    // Generate signed upload URL
    const result = await getSignedUploadUrl({ propertyId, tag, fileName });

    if (!result) {
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

