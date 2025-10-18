'use server';

import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { randomBytes } from 'crypto';

function generateUploadToken(): string {
  return randomBytes(32).toString('base64url');
}

async function simulateNotification(data: {
  recipient: { name: string; email: string; phone: string };
  notification: { notifyNow: boolean; preferredChannel: 'email' | 'sms' | 'both' };
  request: { id: string; title: string; request_items: Array<{ tag: string; upload_token: string }> };
  items: string[];
}) {
  try {
    console.log('Sending notification:', {
      recipient: data.recipient,
      channel: data.notification.preferredChannel,
      requestTitle: data.request.title,
    });

    // Generate upload links for each item using actual tokens
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.filevo.io';
    const uploadLinks = data.request.request_items.map(item => ({
      tag: item.tag,
      link: `${baseUrl}/r/${item.upload_token}`
    }));

    // Send email via Resend
    if (data.notification.preferredChannel === 'email' || data.notification.preferredChannel === 'both') {
      const emailContent = generateEmailContent(data.request.title, data.items, uploadLinks);
      
      console.log('Attempting to send email via Resend:', {
        from: process.env.RESEND_FROM_EMAIL || 'noreply@filevo.io',
        to: data.recipient.email,
        subject: `Document Request: ${data.request.title}`,
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length || 0
      });
      
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@filevo.io',
          to: [data.recipient.email],
          subject: `Document Request: ${data.request.title}`,
          html: emailContent,
        }),
      });

      console.log('Resend API response status:', emailResponse.status);

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Resend email failed:', errorData);
        return { success: false, error: 'Failed to send email notification' };
      } else {
        const successData = await emailResponse.json();
        console.log('Resend email sent successfully:', successData);
      }
    }

    // Send SMS via Twilio (if SMS is enabled)
    if (data.notification.preferredChannel === 'sms' || data.notification.preferredChannel === 'both') {
      const smsContent = generateSMSContent(data.request.title, data.items);
      
      const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: data.recipient.phone,
          From: process.env.TWILIO_PHONE_NUMBER || '',
          Body: smsContent,
        }),
      });

      if (!smsResponse.ok) {
        const errorData = await smsResponse.json();
        console.error('Twilio SMS failed:', errorData);
        return { success: false, error: 'Failed to send SMS notification' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Notification sending failed:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

function generateEmailContent(title: string, items: string[], uploadLinks: { tag: string; link: string }[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.filevo.io';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Request: ${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
          <img src="${baseUrl}/brand/filevo-icon.png" alt="Filevo" style="height: 48px; width: auto; margin-bottom: 16px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Document Request</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${title}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Hello,</p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            You have received a new document request. Please upload the following documents:
          </p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Required Documents</h3>
            <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              ${items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
            </ul>
          </div>
          
          <div style="margin: 32px 0;">
            <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Upload Your Documents</h3>
            ${uploadLinks.map(({ tag, link }) => `
              <div style="margin-bottom: 16px;">
                <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">${tag}</p>
                <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  📁 Upload ${tag}
                </a>
              </div>
            `).join('')}
          </div>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #0c4a6e; font-size: 14px; margin: 0; font-weight: 500;">
              💡 <strong>Accepted file types:</strong> PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB each)
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0 0 0;">
            If you have any questions or need assistance, please don't hesitate to reach out.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 24px 0 0 0;">
            Best regards,<br>
            <strong style="color: #111827;">Property Management Team</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
            Powered by <strong style="color: #111827;">Filevo</strong>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Secure document collection and workflow automation
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

function generateSMSContent(title: string, items: string[]): string {
  return `Document Request: ${title}. Please upload: ${items.join(', ')}. Use the secure links provided. Questions? Reply to this message.`;
}

export async function createRequest(data: {
  propertyId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  items: string[];
  recipient?: {
    name: string;
    email: string;
    phone: string;
  } | null;
  notification?: {
    notifyNow: boolean;
    preferredChannel: 'email' | 'sms' | 'both';
  } | null;
}) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    // Create request
    const { data: request, error: requestError } = await db
      .from('requests')
      .insert({
        property_id: data.propertyId,
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate || null,
        created_by: user.id,
        recipient_name: data.recipient?.name || null,
        recipient_email: data.recipient?.email || null,
        recipient_phone: data.recipient?.phone || null,
        notify_pref: data.notification?.preferredChannel || null,
        notified_at: null, // Will be set if notification is sent
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating request:', requestError);
      console.error('Request data:', {
        property_id: data.propertyId,
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        created_by: user.id,
        recipient_name: data.recipient?.name,
        recipient_email: data.recipient?.email,
        recipient_phone: data.recipient?.phone,
        notify_pref: data.notification?.preferredChannel,
      });
      return { success: false, error: `Failed to create request: ${requestError.message}` };
    }

    // Create request items with upload tokens
    const items = data.items.map((tag) => ({
      request_id: request.id,
      tag,
      upload_token: generateUploadToken(),
      status: 'pending' as const,
    }));

    const { error: itemsError } = await db.from('request_items').insert(items);

    if (itemsError) {
      console.error('Error creating request items:', itemsError);
      console.error('Items data:', items);
      // Rollback: delete the request
      await db.from('requests').delete().eq('id', request.id);
      return { success: false, error: `Failed to create request items: ${itemsError.message}` };
    }

    // Handle messaging if notification is enabled
    let notificationSent = false;
    if (data.notification?.notifyNow && data.recipient) {
      try {
        const messagingEnabled = process.env.MESSAGING_SEND_ENABLED === 'true';
        console.log('Notification settings:', {
          notifyNow: data.notification.notifyNow,
          recipient: data.recipient,
          messagingEnabled,
          envVar: process.env.MESSAGING_SEND_ENABLED
        });
        
        if (messagingEnabled) {
          // Simulate sending notifications
          const notificationResult = await simulateNotification({
            recipient: data.recipient,
            notification: data.notification,
            request: { ...request, request_items: items },
            items: data.items,
          });

          if (notificationResult.success) {
            // Update notified_at timestamp
            await db
              .from('requests')
              .update({ notified_at: new Date().toISOString() })
              .eq('id', request.id);
            
            notificationSent = true;
          }
        } else {
          console.log('Messaging disabled - MESSAGING_SEND_ENABLED is not set to "true"');
        }
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request creation if notification fails
      }
    }

    // Log activity
    await logActivity({
      actor: user.id,
      action: 'created',
      entity: 'request',
      entity_id: request.id,
    });

    revalidatePath(`/app/property/${data.propertyId}/requests`);
    return { 
      success: true, 
      data: { 
        ...request, 
        request_items: items,
        notification_sent: notificationSent 
      } 
    };
  } catch (error) {
    console.error('Exception in createRequest:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateRequest(data: {
  requestId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  recipient?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    // Update request
    const { error: requestError } = await db
      .from('requests')
      .update({
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate || null,
        recipient_name: data.recipient?.name || null,
        recipient_email: data.recipient?.email || null,
        recipient_phone: data.recipient?.phone || null,
      })
      .eq('id', data.requestId);

    if (requestError) {
      console.error('Error updating request:', requestError);
      return { success: false, error: 'Failed to update request' };
    }

    // Log activity
    await logActivity({
      actor: user.id,
      action: 'updated',
      entity: 'request',
      entity_id: data.requestId,
    });

    revalidatePath(`/app/property/${data.requestId}/requests`);
    return { success: true };
  } catch (error) {
    console.error('Exception in updateRequest:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function resendNotification(data: {
  requestId: string;
  recipient: {
    name: string;
    email: string;
    phone: string;
  };
  notification: {
    notifyNow: boolean;
    preferredChannel: 'email' | 'sms' | 'both';
  };
}) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    // Get the request details
    const { data: request, error: requestError } = await db
      .from('requests')
      .select(`
        id,
        title,
        request_items(tag, upload_token)
      `)
      .eq('id', data.requestId)
      .single();

    if (requestError || !request) {
      console.error('Error fetching request:', requestError);
      return { success: false, error: 'Request not found' };
    }

    // Send notification
    const notificationResult = await simulateNotification({
      recipient: data.recipient,
      notification: data.notification,
      request: request,
      items: request.request_items.map((item: { tag: string; upload_token: string }) => item.tag),
    });

    if (notificationResult.success) {
      // Update notified_at timestamp
      await db
        .from('requests')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', data.requestId);

      // Log activity
      await logActivity({
        actor: user.id,
        action: 'resent_notification',
        entity: 'request',
        entity_id: data.requestId,
      });

      revalidatePath(`/app/property/${data.requestId}/requests`);
      return { success: true };
    } else {
      return { success: false, error: notificationResult.error || 'Failed to send notification' };
    }
  } catch (error) {
    console.error('Exception in resendNotification:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteRequest(requestId: string) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    // Log before deleting
    await logActivity({
      actor: user.id,
      action: 'deleted',
      entity: 'request',
      entity_id: requestId,
    });

    const { error } = await db.from('requests').delete().eq('id', requestId);

    if (error) {
      console.error('Error deleting request:', error);
      return { success: false, error: 'Failed to delete request' };
    }

    revalidatePath('/app/property');
    return { success: true };
  } catch (error) {
    console.error('Exception in deleteRequest:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

