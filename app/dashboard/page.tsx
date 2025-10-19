import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  await requireUser();
  const db = await supabaseServer();

  // Get all properties
  const { data: properties } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  // Only get requests from existing properties
  const propertyIds = properties?.map(p => p.id) || [];
  const { data: requests } = await db
    .from('requests')
    .select(`
      id, 
      title, 
      description,
      due_date, 
      property_id, 
      created_at,
      request_items(id, status, tag)
    `)
    .in('property_id', propertyIds) // Only requests from existing properties
    .order('created_at', { ascending: false });

  // Get files only from existing requests
  const requestIds = requests?.map(r => r.id) || [];
  const { data: allFiles } = await db
    .from('files')
    .select(`
      id, 
      uploaded_at,
      request_item_id,
      request_items!inner(
        request_id,
        requests!inner(id)
      )
    `)
    .in('request_items.requests.id', requestIds);

  return (
    <AppShell>
      <DashboardClient 
        properties={properties || []}
        requests={requests || []}
        allFiles={allFiles || []}
      />
    </AppShell>
  );
}

