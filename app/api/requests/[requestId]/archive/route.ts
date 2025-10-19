import { NextRequest, NextResponse } from 'next/server';
import { archiveRequest } from '@/app/app/property/[id]/requests/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const result = await archiveRequest(requestId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Archive request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
