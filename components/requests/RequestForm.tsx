'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createRequest } from '@/app/app/property/[id]/requests/actions';
import { AIComposeModal } from './AIComposeModal';
import { SharePanel } from './SharePanel';

interface RequestItem {
  tag: string;
  id: string;
}

interface RecipientData {
  name: string;
  email: string;
  phone: string;
}

interface NotificationData {
  notifyNow: boolean;
  preferredChannel: 'email' | 'sms' | 'both';
}

export function RequestForm({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<RequestItem[]>([{ tag: '', id: Date.now().toString() }]);
  const [recipient, setRecipient] = useState<RecipientData>({ name: '', email: '', phone: '' });
  const [notification, setNotification] = useState<NotificationData>({ notifyNow: false, preferredChannel: 'email' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAICompose, setShowAICompose] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<any>(null);

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

  const updateRecipient = (field: keyof RecipientData, value: string) => {
    setRecipient(prev => ({ ...prev, [field]: value }));
  };

  const updateNotification = (field: keyof NotificationData, value: any) => {
    setNotification(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const itemTags = items.map((i) => i.tag.trim()).filter(Boolean);
    
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (itemTags.length === 0) {
      setError('Please add at least one required document');
      return false;
    }

    if (notification.notifyNow) {
      if (notification.preferredChannel === 'email' && !recipient.email.trim()) {
        setError('Email is required when Email notification is enabled');
        return false;
      }
      if (notification.preferredChannel === 'sms' && !recipient.phone.trim()) {
        setError('Phone number is required when SMS notification is enabled');
        return false;
      }
      if (notification.preferredChannel === 'both' && (!recipient.email.trim() || !recipient.phone.trim())) {
        setError('Both email and phone number are required when Both notification is enabled');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const itemTags = items.map((i) => i.tag.trim()).filter(Boolean);
      
      const result = await createRequest({
        propertyId,
        title,
        description,
        dueDate: dueDate || null,
        items: itemTags,
        recipient: recipient.name.trim() ? recipient : null,
        notification: notification.notifyNow ? notification : null,
      });

      if (result.success) {
        setCreatedRequest(result.data);
        setShowSharePanel(true);
        // Don't close the modal yet - show share panel
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAICompose = (generatedText: string) => {
    setDescription(generatedText);
    setShowAICompose(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setItems([{ tag: '', id: Date.now().toString() }]);
    setRecipient({ name: '', email: '', phone: '' });
    setNotification({ notifyNow: false, preferredChannel: 'email' });
    setError(null);
    setShowSharePanel(false);
    setCreatedRequest(null);
  };

  const canNotify = recipient.email.trim() || recipient.phone.trim();

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>New Request</Button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl my-8">
          <CardHeader>
            <CardTitle>Create Document Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Request Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="e.g. Tenant Move-In Documents"
                />
              </div>

              {/* Description with AI Compose */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAICompose(true)}
                  >
                    Generate with AI
                  </Button>
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Optional details about this request"
                />
              </div>

              {/* Recipient Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-fg">Recipient Information (Optional)</h3>
                
                <div>
                  <Label htmlFor="recipientName" className="text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="recipientName"
                    type="text"
                    value={recipient.name}
                    onChange={(e) => updateRecipient('name', e.target.value)}
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
                      value={recipient.email}
                      onChange={(e) => updateRecipient('email', e.target.value)}
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
                      value={recipient.phone}
                      onChange={(e) => updateRecipient('phone', e.target.value)}
                      className="mt-1"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyNow"
                    checked={notification.notifyNow}
                    onChange={(e) => updateNotification('notifyNow', e.target.checked)}
                    disabled={!canNotify}
                    className="rounded border-border"
                  />
                  <Label htmlFor="notifyNow" className="text-sm font-medium">
                    Notify now
                  </Label>
                </div>
                
                {!canNotify && (
                  <p className="text-xs text-fg-muted">
                    Add email or phone number to enable notifications
                  </p>
                )}

                {notification.notifyNow && canNotify && (
                  <div>
                    <Label className="text-sm font-medium">Preferred channel</Label>
                    <div className="mt-2 space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="channel"
                          value="email"
                          checked={notification.preferredChannel === 'email'}
                          onChange={(e) => updateNotification('preferredChannel', e.target.value)}
                          disabled={!recipient.email.trim()}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="channel"
                          value="sms"
                          checked={notification.preferredChannel === 'sms'}
                          onChange={(e) => updateNotification('preferredChannel', e.target.value)}
                          disabled={!recipient.phone.trim()}
                          className="rounded border-border"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="channel"
                          value="both"
                          checked={notification.preferredChannel === 'both'}
                          onChange={(e) => updateNotification('preferredChannel', e.target.value)}
                          disabled={!recipient.email.trim() || !recipient.phone.trim()}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Both</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
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
                <p className="text-xs text-fg-muted mt-1">
                  Reminders will be sent 24 hours before due date (coming soon)
                </p>
              </div>

              {/* Required Documents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    Required Documents *
                  </Label>
                  <Button type="button" size="sm" variant="ghost" onClick={addItem}>
                    + Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <Input
                        type="text"
                        value={item.tag}
                        onChange={(e) => updateItem(item.id, e.target.value)}
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
                  onClick={handleClose}
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

      {/* AI Compose Modal */}
      {showAICompose && (
        <AIComposeModal
          onClose={() => setShowAICompose(false)}
          onInsert={handleAICompose}
          requestTitle={title}
          requestItems={items.map(i => i.tag).filter(Boolean)}
        />
      )}

      {/* Share Panel */}
      {showSharePanel && createdRequest && (
        <SharePanel
          request={createdRequest}
          onClose={handleClose}
          notificationSent={notification.notifyNow}
        />
      )}
    </>
  );
}

