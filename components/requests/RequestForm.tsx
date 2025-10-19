'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UnifiedRequestModal } from './UnifiedRequestModal';

export function RequestForm({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>New Request</Button>
    );
  }

  return (
    <UnifiedRequestModal
      onClose={handleClose}
      properties={[{ id: propertyId, name: 'Current Property' }]} // Property name not needed for locked property
      selectedPropertyId={propertyId}
      showPresetSelector={false}
    />
  );
}

