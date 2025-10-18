import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { requestTitle, requestItems } = await request.json();

    if (!requestTitle || !requestItems || !Array.isArray(requestItems)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // For now, generate static content
    // In production, you would integrate with OpenAI API here
    const emailContent = `Hi there,

I hope this message finds you well. I'm reaching out regarding the document request for "${requestTitle}".

Please upload the following documents:
${requestItems.map(item => `• ${item}`).join('\n')}

You can upload these documents using the secure link provided. If you have any questions or need assistance, please don't hesitate to reach out.

Thank you for your prompt attention to this matter.

Best regards,
Property Management Team`;

    const smsContent = `Hi! Please upload these documents for "${requestTitle}": ${requestItems.join(', ')}. Use the secure link provided. Questions? Reply to this message.`;

    return NextResponse.json({
      email: emailContent,
      sms: smsContent,
    });

  } catch (error) {
    console.error('AI compose error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
