import { NextRequest, NextResponse } from 'next/server';
import { deleteRequest } from '@/app/app/property/[id]/requests/actions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const result = await deleteRequest(requestId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      if (result.hasFiles) {
        return NextResponse.json({ error: result.error }, { status: 409 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
