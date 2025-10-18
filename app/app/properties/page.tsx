import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { PropertiesPageClient } from './PropertiesPageClient';

export default async function PropertiesPage() {
  await requireUser();
  const db = await supabaseServer();

  const { data: properties, error } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
  }

  return (
    <AppShell>
      <PropertiesPageClient properties={properties || []} />
    </AppShell>
  );
}

