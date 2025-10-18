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
  request: { id: string; title: string };
  items: string[];
}) {
  try {
    console.log('Sending notification:', {
      recipient: data.recipient,
      channel: data.notification.preferredChannel,
      requestTitle: data.request.title,
    });

    // Send email via Resend
    if (data.notification.preferredChannel === 'email' || data.notification.preferredChannel === 'both') {
      const emailContent = generateEmailContent(data.request.title, data.items);
      
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

function generateEmailContent(title: string, items: string[]): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Document Request: ${title}</h2>
      <p>Hello,</p>
      <p>You have received a new document request. Please upload the following documents:</p>
      <ul>
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <p>You can upload these documents using the secure links provided.</p>
      <p>If you have any questions, please don't hesitate to reach out.</p>
      <p>Best regards,<br>Property Management Team</p>
    </div>
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
            request: request,
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
        request_items(tag)
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
      items: request.request_items.map((item: { tag: string }) => item.tag),
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

