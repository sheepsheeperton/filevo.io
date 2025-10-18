'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { PropertyManagement } from '@/components/properties/PropertyManagement';

interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface PropertiesPageClientProps {
  properties: Property[];
}

export function PropertiesPageClient({ properties }: PropertiesPageClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Properties</h1>
          <p className="text-fg-muted mt-2">Create and manage properties to organize your document requests</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleToggleEditMode}
            variant={isEditMode ? "secondary" : "outline"}
            className={isEditMode ? "bg-brand hover:bg-brand-600 text-white" : ""}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Properties'}
          </Button>
          <PropertyForm />
        </div>
      </div>

      {properties && properties.length > 0 ? (
        <PropertyManagement 
          properties={properties} 
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
        />
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-6">
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
                <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">
                  Properties help you organize document requests for different locations or projects. Create your first property to get started.
                </p>
              </div>
              <PropertyForm />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
