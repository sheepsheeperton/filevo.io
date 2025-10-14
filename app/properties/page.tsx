import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { PropertyForm } from '@/components/properties/PropertyForm';

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
      <div className="max-w-6xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Properties</h1>
            <p className="text-fg-muted mt-1">Manage your properties and document requests</p>
          </div>
          <PropertyForm />
        </div>

        {properties && properties.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2 rounded-2xl"
              >
                <Card className="hover:bg-elev transition-colors cursor-pointer h-full">
                  <CardContent className="py-4">
                    <div className="font-medium text-lg">{property.name}</div>
                    <div className="text-sm text-fg-muted mt-2">
                      {property.address || 'No address specified'}
                    </div>
                    <div className="text-xs text-fg-subtle mt-3">
                      Added {new Date(property.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-fg-muted">
                  <svg
                    className="mx-auto h-12 w-12 text-fg-subtle"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium">No properties yet</h3>
                  <p className="text-sm text-fg-muted mt-1">
                    Get started by creating your first property
                  </p>
                </div>
                <PropertyForm />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
