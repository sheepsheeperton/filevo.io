import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { MaintenanceClient } from './MaintenanceClient';

interface File {
  id: string;
  file_name: string;
  uploaded_at: string;
  request_item_id: string;
  request_items: {
    id: string;
    tag: string;
    request_id: string;
    requests: {
      id: string;
      title: string;
      property_id: string;
      properties: {
        id: string;
        name: string;
      };
    };
  } | null;
}

export default async function MaintenancePage() {
  await requireUser();
  const db = await supabaseServer();

  // Get all properties
  const { data: properties } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  // Get all requests with detailed information
  const { data: requests } = await db
    .from('requests')
    .select(`
      id, 
      title, 
      description,
      due_date, 
      property_id, 
      created_at,
      archived_at,
      request_items(id, status, tag)
    `)
    .is('archived_at', null) // Exclude archived requests
    .order('created_at', { ascending: false });

  // Get all files for maintenance tracking
  const { data: allFiles } = await db
    .from('files')
    .select(`
      id, 
      file_name, 
      uploaded_at,
      request_item_id,
      request_items(
        id,
        tag,
        request_id,
        requests(
          id,
          title,
          property_id,
          properties(id, name)
        )
      )
    `)
    .order('uploaded_at', { ascending: false });

  return (
    <AppShell>
      <MaintenanceClient 
        properties={properties || []}
        requests={requests || []}
        files={(allFiles || []) as unknown as File[]}
      />
    </AppShell>
  );
}