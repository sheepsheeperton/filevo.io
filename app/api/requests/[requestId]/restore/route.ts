import { NextRequest, NextResponse } from 'next/server';
import { restoreRequest } from '@/app/app/property/[id]/requests/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const result = await restoreRequest(requestId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Restore request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
