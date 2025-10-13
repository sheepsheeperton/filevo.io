export function requestCreatedEmail({
  recipientName,
  propertyName,
  requestTitle,
  uploadLink,
  dueDate,
}: {
  recipientName?: string;
  propertyName: string;
  requestTitle: string;
  uploadLink: string;
  dueDate?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Request - ${requestTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h1 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 24px;">Document Request</h1>
    <p style="color: #666; margin: 0;">Property: ${propertyName}</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    ${recipientName ? `<p style="margin: 0 0 16px 0;">Hello ${recipientName},</p>` : ''}
    
    <p style="margin: 0 0 16px 0;">
      You have been requested to upload documents for <strong>${propertyName}</strong>.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #ff6b35; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${requestTitle}</p>
      ${dueDate ? `<p style="margin: 0; color: #666; font-size: 14px;">Due: ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
    </div>

    <p style="margin: 16px 0;">
      Click the button below to upload your documents securely:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${uploadLink}" 
         style="display: inline-block; background-color: #ff6b35; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Upload Documents
      </a>
    </div>

    <p style="margin: 16px 0 0 0; font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:<br>
      <a href="${uploadLink}" style="color: #ff6b35; word-break: break-all;">${uploadLink}</a>
    </p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0;">Powered by Filevo</p>
    <p style="margin: 8px 0 0 0;">Secure document collection for property managers</p>
  </div>
</body>
</html>
  `.trim();
}

