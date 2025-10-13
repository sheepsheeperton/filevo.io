'use server';

import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { randomBytes } from 'crypto';

function generateUploadToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createRequest(data: {
  propertyId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  items: string[];
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

    // Log activity
    await logActivity({
      actor: user.id,
      action: 'created',
      entity: 'request',
      entity_id: request.id,
    });

    revalidatePath(`/app/property/${data.propertyId}/requests`);
    return { success: true, data: request };
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

