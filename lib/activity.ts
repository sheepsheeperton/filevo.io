import { supabaseServer } from './supabase/server';

/**
 * Activity logging helper
 * Records user actions for audit trail
 */

export interface LogActivityParams {
  actor: string; // User ID
  action: string; // e.g., 'created', 'updated', 'deleted', 'uploaded'
  entity: string; // e.g., 'property', 'request', 'file'
  entity_id?: string; // ID of the entity
}

export async function logActivity({
  actor,
  action,
  entity,
  entity_id,
}: LogActivityParams): Promise<boolean> {
  try {
    const db = await supabaseServer();

    const { error } = await db.from('activity_logs').insert({
      actor,
      action,
      entity,
      entity_id: entity_id || null,
    });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in logActivity:', error);
    return false;
  }
}

