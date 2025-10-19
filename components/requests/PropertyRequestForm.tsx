'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RequestForm } from './RequestForm';

interface PropertyRequestFormProps {
  propertyId: string;
  propertyName?: string;
}

export function PropertyRequestForm({ propertyId, propertyName }: PropertyRequestFormProps) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <RequestForm
        onClose={() => setShowForm(false)}
        properties={[{ id: propertyId, name: propertyName || 'Selected Property' }]}
        selectedPropertyId={propertyId}
        showPresetSelector={false}
      />
    );
  }

  return (
    <Button onClick={() => setShowForm(true)}>
      <Plus className="h-4 w-4 mr-2" />
      New Request
    </Button>
  );
}
