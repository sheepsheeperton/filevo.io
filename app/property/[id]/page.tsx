import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const db = supabaseServer();

  const { data: property } = await db.from('properties').select('id, name, address, created_at').eq('id', id).single();
  if (!property) return notFound();

  const { data: reqs } = await db
    .from('requests')
    .select('id, title, description, due_date, created_at')
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  // For each request, compute counts per status
  const { data: items } = await db
    .from('request_items')
    .select('id, request_id, status');

  const countsByRequest = new Map<string, Record<string, number>>();
  (items || []).forEach(i => {
    const key = i.request_id!;
    const bucket = countsByRequest.get(key) || { pending: 0, received: 0, past_due: 0 };
    bucket[i.status as 'pending'|'received'|'past_due']++;
    countsByRequest.set(key, bucket);
  });

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{property.name}</h1>
        <p className="text-gray-600">{property.address || '—'}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Requests</h2>
        {(reqs || []).map(r => {
          const c = countsByRequest.get(r.id) || { pending:0, received:0, past_due:0 };
          return (
            <div key={r.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-gray-600">Due: {r.due_date || '—'}</div>
                </div>
                <div className="text-sm">
                  <span className="mr-3">Pending: {c.pending}</span>
                  <span className="mr-3">Received: {c.received}</span>
                  <span className="mr-3">Past Due: {c.past_due}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

