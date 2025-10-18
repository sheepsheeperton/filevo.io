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
  request: any;
  items: string[];
}) {
  try {
    // Simulate notification sending
    console.log('Simulating notification:', {
      recipient: data.recipient,
      channel: data.notification.preferredChannel,
      requestTitle: data.request.title,
    });

    // In a real implementation, you would:
    // 1. Send email via your email provider (SendGrid, AWS SES, etc.)
    // 2. Send SMS via your SMS provider (Twilio, AWS SNS, etc.)
    // 3. Handle delivery status and errors

    // For now, just simulate success
    return { success: true };
  } catch (error) {
    console.error('Notification simulation failed:', error);
    return { success: false, error: 'Failed to send notification' };
  }
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
      return { success: false, error: 'Failed to create request' };
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
      // Rollback: delete the request
      await db.from('requests').delete().eq('id', request.id);
      return { success: false, error: 'Failed to create request items' };
    }

    // Handle messaging if notification is enabled
    let notificationSent = false;
    if (data.notification?.notifyNow && data.recipient) {
      try {
        const messagingEnabled = process.env.MESSAGING_SEND_ENABLED === 'true';
        
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

