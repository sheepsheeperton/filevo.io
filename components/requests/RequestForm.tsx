'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRequest } from '@/app/app/property/[id]/requests/actions';

interface RequestItem {
  tag: string;
  id: string;
}

export function RequestForm({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<RequestItem[]>([{ tag: '', id: Date.now().toString() }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { tag: '', id: Date.now().toString() }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, tag: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, tag } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const itemTags = items.map((i) => i.tag.trim()).filter(Boolean);
    if (itemTags.length === 0) {
      setError('Please add at least one item');
      setIsLoading(false);
      return;
    }

    try {
      const result = await createRequest({
        propertyId,
        title,
        description,
        dueDate: dueDate || null,
        items: itemTags,
      });

      if (result.success) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setItems([{ tag: '', id: Date.now().toString() }]);
        setIsOpen(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>New Request</Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <CardTitle>Create Document Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Request Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g. Tenant Move-In Documents"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Optional details about this request"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-2">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Required Documents *
                </label>
                <Button type="button" size="sm" variant="ghost" onClick={addItem}>
                  + Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-2">
                    <input
                      type="text"
                      value={item.tag}
                      onChange={(e) => updateItem(item.id, e.target.value)}
                      className="flex-1 px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder={`Document ${index + 1} (e.g. Driver's License)`}
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>
                {isLoading ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

