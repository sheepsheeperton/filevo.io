import { requireUser } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/storage';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    
    const { storagePath } = await req.json();

    if (!storagePath) {
      return new Response('Missing storage path', { status: 400 });
    }

    const signedUrl = await getSignedDownloadUrl(storagePath);

    if (!signedUrl) {
      return new Response('Failed to generate download URL', { status: 500 });
    }

    return Response.json({ signedUrl });
  } catch (error) {
    console.error('Error in download:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

