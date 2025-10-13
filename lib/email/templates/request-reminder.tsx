export function requestReminderEmail({
  propertyName,
  tag,
  uploadLink,
  dueDate,
}: {
  propertyName: string;
  tag: string;
  uploadLink: string;
  dueDate?: string;
}) {
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: Document Upload Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${isOverdue ? '#fee' : '#fff8f3'}; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 2px solid ${isOverdue ? '#dc2626' : '#ff6b35'};">
    <h1 style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 24px;">
      ${isOverdue ? '⚠️ Overdue' : '🔔 Reminder'}: Document Upload Required
    </h1>
    <p style="color: #666; margin: 0;">Property: ${propertyName}</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px 0;">
      This is a reminder that we are still waiting for your document upload.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid ${isOverdue ? '#dc2626' : '#fbbf24'}; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${tag}</p>
      ${dueDate ? `
        <p style="margin: 0; color: ${isOverdue ? '#dc2626' : '#666'}; font-size: 14px; font-weight: ${isOverdue ? '600' : '400'};">
          ${isOverdue ? 'Was due' : 'Due'}: ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      ` : ''}
    </div>

    <p style="margin: 16px 0;">
      Please upload your document as soon as possible by clicking the button below:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${uploadLink}" 
         style="display: inline-block; background-color: #ff6b35; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Upload Now
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

