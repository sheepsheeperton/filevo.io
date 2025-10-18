'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateRequest } from '@/app/app/property/[id]/requests/actions';

interface RequestItem {
  id: string;
  tag: string;
  status: 'pending' | 'received' | 'past_due';
  upload_token: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  request_items: RequestItem[];
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  notify_pref?: string | null;
  notified_at?: string | null;
}

interface EditRequestModalProps {
  request: Request;
  onClose: () => void;
}

export function EditRequestModal({ request, onClose }: EditRequestModalProps) {
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description || '');
  const [dueDate, setDueDate] = useState(request.due_date || '');
  const [recipientName, setRecipientName] = useState(request.recipient_name || '');
  const [recipientEmail, setRecipientEmail] = useState(request.recipient_email || '');
  const [recipientPhone, setRecipientPhone] = useState(request.recipient_phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateRequest({
        requestId: request.id,
        title,
        description: description || null,
        dueDate: dueDate || null,
        recipient: {
          name: recipientName || null,
          email: recipientEmail || null,
          phone: recipientPhone || null,
        },
      });

      if (result.success) {
        onClose();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        setError(result.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Edit request error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <CardTitle>Edit Document Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Request Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={4}
                placeholder="Optional description for the request"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fg">Recipient Information</h3>
              
              <div>
                <Label htmlFor="recipientName" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="recipientName"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1"
                  placeholder="Recipient's name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientEmail" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="mt-1"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientPhone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
