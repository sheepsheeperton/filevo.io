import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { WorkflowClient } from './WorkflowClient';

export default async function AuditPage() {
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
      request_items(id, status, tag)
    `)
    .order('created_at', { ascending: false });

  // Get all files for time saved calculation
  const { data: allFiles } = await db
    .from('files')
    .select('id, uploaded_at');

  return (
    <AppShell>
      <WorkflowClient 
        category="audit"
        properties={properties || []}
        requests={requests || []}
        allFiles={allFiles || []}
      />
    </AppShell>
  );
}
