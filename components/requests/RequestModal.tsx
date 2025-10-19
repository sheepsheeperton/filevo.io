'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentUpload } from '@/components/ui/DocumentUpload';
import { createRequest } from '@/app/app/property/[id]/requests/actions';
import { SharePanel } from './SharePanel';
import { X, Upload } from 'lucide-react';

interface RequestItem {
  tag: string;
  id: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
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

interface RequestModalProps {
  onClose: () => void;
  presetItems?: string[];
  properties: Array<{ id: string; name: string }>;
}

export function RequestModal({ onClose, presetItems = [], properties }: RequestModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [recipient, setRecipient] = useState<RecipientData>({ name: '', email: '', phone: '' });
  const [notification, setNotification] = useState<NotificationData>({ notifyNow: false, preferredChannel: 'email' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<{
    id: string;
    title: string;
    request_items: Array<{ id: string; tag: string; upload_token: string }>;
  } | null>(null);

  // Initialize with preset items
  useEffect(() => {
    if (presetItems.length > 0) {
      setItems(presetItems.map((item, index) => ({ tag: item, id: `preset-${index}` })));
      setTitle(presetItems.includes('Driver\'s license') ? 'New Tenant Onboarding' : 'Lease Renewal');
      setDescription(presetItems.includes('Driver\'s license') 
        ? 'Please provide the following documents for your new lease.'
        : 'Please provide the following documents for your lease renewal.');
    } else {
      setItems([{ tag: '', id: Date.now().toString() }]);
    }
  }, [presetItems]);

  const addItem = () => {
    setItems([...items, { tag: '', id: Date.now().toString() }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, tag: string) => {
    setItems(items.map(item => item.id === id ? { ...item, tag } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPropertyId) {
      setError('Please select a property');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    const validItems = items.filter(item => item.tag.trim());
    if (validItems.length === 0) {
      setError('Please add at least one document item');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating request with uploaded files:', {
        fileCount: uploadedFiles.length,
        files: uploadedFiles.map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type }))
      });

      const result = await createRequest({
        propertyId: selectedPropertyId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        items: validItems.map(item => item.tag.trim()),
        uploadedFiles: uploadedFiles.map(uf => uf.file),
        recipient,
        notification
      });

      console.log('Request creation result:', result);

      if (result.success && result.data) {
        setCreatedRequest(result.data);
        setShowSharePanel(true);
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Request creation error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (showSharePanel && createdRequest) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Request Created Successfully</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <SharePanel 
              request={createdRequest}
              onClose={() => {
                setShowSharePanel(false);
                handleClose();
              }}
              notificationSent={notification.notifyNow}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create New Request</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Property *</Label>
              <select
                id="property"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-fg"
                required
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Tenant Onboarding"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for the request"
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Document Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Required Documents *</Label>
                <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                  Add Item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    value={item.tag}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    placeholder={`Document ${index + 1}`}
                    className="flex-1"
                  />
                  {items.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Document Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-fg-muted" />
                <Label>Upload Documents to Send</Label>
              </div>
              <p className="text-sm text-fg-muted">
                Upload documents that will be sent to the tenant via email along with the request.
              </p>
              <DocumentUpload
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                maxFiles={10}
              />
            </div>

            {/* Recipient Information */}
            <div className="space-y-4">
              <Label>Recipient Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Name</Label>
                  <Input
                    id="recipientName"
                    value={recipient.name}
                    onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                    placeholder="Recipient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipient.email}
                    onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Phone</Label>
                <Input
                  id="recipientPhone"
                  value={recipient.phone}
                  onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-3">
              <Label>Notification Settings</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notification.notifyNow}
                    onChange={(e) => setNotification({ ...notification, notifyNow: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Send notification immediately</span>
                </label>
                {notification.notifyNow && (
                  <div className="space-y-2">
                    <Label>Preferred Channel</Label>
                    <select
                      value={notification.preferredChannel}
                      onChange={(e) => setNotification({ 
                        ...notification, 
                        preferredChannel: e.target.value as 'email' | 'sms' | 'both' 
                      })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-surface text-fg"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Request'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
