'use server';

import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProperty(data: { name: string; address?: string }) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    const { data: property, error } = await db
      .from('properties')
      .insert({
        name: data.name,
        address: data.address || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return { success: false, error: 'Failed to create property' };
    }

    // Note: Activity logging removed for now to avoid database dependency issues
    // await logActivity({
    //   actor: user.id,
    //   action: 'created',
    //   entity: 'property',
    //   entity_id: property.id,
    // });

    revalidatePath('/app/properties');
    return { success: true, data: property };
  } catch (error) {
    console.error('Exception in createProperty:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateProperty(
  id: string,
  data: { name: string; address?: string }
) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    const { data: property, error } = await db
      .from('properties')
      .update({
        name: data.name,
        address: data.address || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return { success: false, error: 'Failed to update property' };
    }

    // Note: Activity logging removed for now to avoid database dependency issues
    // await logActivity({
    //   actor: user.id,
    //   action: 'updated',
    //   entity: 'property',
    //   entity_id: property.id,
    // });

    revalidatePath('/app/properties');
    revalidatePath(`/app/property/${id}`);
    return { success: true, data: property };
  } catch (error) {
    console.error('Exception in updateProperty:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteProperty(id: string) {
  try {
    const user = await requireUser();
    const db = await supabaseServer();

    // Note: Activity logging removed for now to avoid database dependency issues
    // await logActivity({
    //   actor: user.id,
    //   action: 'deleted',
    //   entity: 'property',
    //   entity_id: id,
    // });

    const { error } = await db.from('properties').delete().eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      return { success: false, error: 'Failed to delete property' };
    }

    revalidatePath('/app/properties');
    return { success: true };
  } catch (error) {
    console.error('Exception in deleteProperty:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
