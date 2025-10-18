'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { updateProperty, deleteProperty } from '@/app/properties/actions';

interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface PropertyManagementProps {
  properties: Property[];
}

export function PropertyManagement({ properties }: PropertyManagementProps) {
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProperties.size === properties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(properties.map(p => p.id)));
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setEditName(property.name);
    setEditAddress(property.address || '');
    setIsEditing(true);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProperty || !editName.trim()) return;
    
    setError(null);
    try {
      const result = await updateProperty(editingProperty.id, {
        name: editName.trim(),
        address: editAddress.trim() || undefined,
      });

      if (result.success) {
        setIsEditing(false);
        setEditingProperty(null);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to update property');
      }
    } catch {
      setError('An unexpected error occurred');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProperties.size === 0) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedProperties.size} ${selectedProperties.size === 1 ? 'property' : 'properties'}? This action cannot be undone and will also delete all associated requests and files.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const deletePromises = Array.from(selectedProperties).map(id => deleteProperty(id));
      const results = await Promise.all(deletePromises);
      
      const failedDeletes = results.filter(result => !result.success);
      if (failedDeletes.length > 0) {
        setError(`Failed to delete ${failedDeletes.length} properties`);
      } else {
        setSelectedProperties(new Set());
        window.location.reload();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProperty(null);
    setEditName('');
    setEditAddress('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Management Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedProperties.size === properties.length && properties.length > 0}
              onChange={handleSelectAll}
              className="rounded border-border bg-elev text-brand focus:ring-brand"
            />
            <span className="text-sm text-fg-muted">
              Select All ({selectedProperties.size}/{properties.length})
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          {selectedProperties.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedProperties.size} ${selectedProperties.size === 1 ? 'Property' : 'Properties'}`}
            </Button>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <Card key={property.id} className="relative">
            <CardContent>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedProperties.has(property.id)}
                  onChange={() => handleSelectProperty(property.id)}
                  className="mt-1 rounded border-border bg-elev text-brand focus:ring-brand"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg">{property.name}</div>
                  <div className="text-sm text-fg-muted mt-1">
                    {property.address || 'No address specified'}
                  </div>
                  <div className="text-xs text-fg-subtle mt-2">
                    Added {new Date(property.created_at).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(property)}
                  className="text-brand hover:text-brand-600 hover:bg-brand/10"
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editingProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Edit Property</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium mb-2">
                    Property Name *
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="e.g. 123 Main St Apartments"
                  />
                </div>

                <div>
                  <label htmlFor="edit-address" className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    id="edit-address"
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="e.g. 123 Main St, Boston, MA"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="bg-brand hover:bg-brand-600 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
