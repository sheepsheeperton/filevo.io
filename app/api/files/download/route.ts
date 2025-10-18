import { requireUser } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/storage';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    
    const { storagePath } = await req.json();

    console.log('Download request for storage path:', storagePath);

    if (!storagePath) {
      console.error('Missing storage path');
      return new Response('Missing storage path', { status: 400 });
    }

    console.log('Generating signed download URL...');
    const signedUrl = await getSignedDownloadUrl(storagePath);

    console.log('Signed download URL result:', signedUrl);

    if (!signedUrl) {
      console.error('Failed to generate download URL');
      return new Response('Failed to generate download URL', { status: 500 });
    }

    return Response.json({ signedUrl });
  } catch (error) {
    console.error('Error in download:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

