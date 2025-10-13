import { supabaseServer } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export default async function DashboardPage() {
  await requireUser();
  const db = supabaseServer();

  const { data: properties } = await db
    .from('properties')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false });

  const { data: recentRequests } = await db
    .from('requests')
    .select('id, title, due_date, property_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Properties</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties?.map(p => (
            <a key={p.id} href={`/property/${p.id}`} className="border rounded p-4 hover:bg-gray-50">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.address || '—'}</div>
            </a>
          )) || <p>No properties yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Recent Requests</h2>
        <ul className="space-y-2">
          {recentRequests?.map(r => (
            <li key={r.id} className="border rounded p-3">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-600">Due: {r.due_date || '—'}</div>
            </li>
          )) || <p>No requests yet.</p>}
        </ul>
      </section>
    </main>
  );
}

