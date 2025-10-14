import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

export default async function PropertyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const db = await supabaseServer();

  const { data: property } = await db
    .from('properties')
    .select('id, name, address')
    .eq('id', id)
    .single();

  if (!property) return notFound();

  const tabs = [
    { href: `/app/property/${id}`, label: 'Overview' },
    { href: `/app/property/${id}/requests`, label: 'Requests' },
    { href: `/app/property/${id}/files`, label: 'Files' },
    { href: `/app/property/${id}/people`, label: 'People' },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl space-y-8">
        <div>
          <Link
            href="/app/properties"
            className="text-sm text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1"
          >
            ← Back to Properties
          </Link>
          <h1 className="text-3xl font-semibold mt-3">{property.name}</h1>
          {property.address && (
            <p className="text-fg-muted mt-2">{property.address}</p>
          )}
        </div>

        <div className="border-b border-border">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-1 py-3 border-b-2 border-transparent hover:border-brand text-sm font-medium text-fg-muted hover:text-fg transition-colors"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </AppShell>
  );
}

