'use client';

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { createRequest } from '@/app/app/property/[id]/requests/actions';

// Lazy load heavy components
const AIComposeModal = lazy(() => import('./AIComposeModal').then(module => ({ default: module.AIComposeModal })));
const DocumentUpload = lazy(() => import('@/components/ui/DocumentUpload').then(module => ({ default: module.DocumentUpload })));

// Performance monitoring
const performanceMark = (name: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(name);
    console.log(`🔍 Performance: ${name}`);
  }
};

const performanceMeasure = (name: string, startMark: string, endMark?: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      if (endMark) {
        window.performance.measure(name, startMark, endMark);
      } else {
        window.performance.measure(name, startMark);
      }
      const measure = window.performance.getEntriesByName(name, 'measure')[0];
      console.log(`⏱️ Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
    } catch {
      console.log(`⏱️ Performance: ${name} - measurement failed`);
    }
  }
};

// Inline presets (no network calls)
const PRESETS = {
  onboarding: {
    title: 'New Tenant Onboarding',
    description: 'Please provide the following documents for your new lease.',
    items: ['Driver\'s license', 'Signed lease', 'Proof of insurance']
  },
  renewal: {
    title: 'Lease Renewal',
    description: 'Please provide the following documents for your lease renewal.',
    items: ['Signed lease', 'Proof of insurance']
  }
} as const;

interface RequestItem {
  id: string;
  tag: string;
}

interface Property {
  id: string;
  name: string;
}

interface RequestFormProps {
  onClose: () => void;
  properties?: Property[];
  selectedPropertyId?: string;
  showPresetSelector?: boolean;
  presetItems?: string[];
}

export function RequestForm({
  onClose,
  properties = [],
  selectedPropertyId,
  showPresetSelector = false,
  presetItems = []
}: RequestFormProps) {
  // Performance tracking
  useState(() => {
    performanceMark('form-mount-start');
    console.log('🚀 New Request Form mounting - zero network calls expected');
  });

  // Memoized values to prevent re-renders
  const memoizedProperties = useMemo(() => properties, [properties]);
  const memoizedPresetItems = useMemo(() => presetItems, [presetItems]);

  // Initialize form state based on props
  const getInitialState = () => {
    performanceMark('form-init-start');
    
    let initialTitle = '';
    let initialDescription = '';
    let initialItems: RequestItem[] = [];
    
    if (memoizedPresetItems.length > 0) {
      // Legacy preset items
      initialTitle = memoizedPresetItems.includes('Driver\'s license') ? 'New Tenant Onboarding' : 'Lease Renewal';
      initialDescription = memoizedPresetItems.includes('Driver\'s license') 
        ? 'Please provide the following documents for your new lease.'
        : 'Please provide the following documents for your lease renewal.';
      initialItems = memoizedPresetItems.map((item, index) => ({ id: `legacy-${index}`, tag: item }));
    } else if (showPresetSelector) {
      // New preset selector
      const preset = PRESETS.onboarding;
      initialTitle = preset.title;
      initialDescription = preset.description;
      initialItems = preset.items.map((item, index) => ({ id: `preset-${index}`, tag: item }));
    } else {
      // Empty form
      initialItems = [{ id: '1', tag: '' }];
    }
    
    performanceMark('form-init-end');
    performanceMeasure('form-init', 'form-init-start', 'form-init-end');
    
    return { initialTitle, initialDescription, initialItems };
  };

  const { initialTitle, initialDescription, initialItems } = getInitialState();

  // Form state
  const [formSelectedPropertyId, setFormSelectedPropertyId] = useState(selectedPropertyId || '');
  const [selectedPreset, setSelectedPreset] = useState<'onboarding' | 'renewal'>('onboarding');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<RequestItem[]>(initialItems);
  const [recipient, setRecipient] = useState({ name: '', email: '', phone: '' });
  const [notifyNow, setNotifyNow] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState<'email' | 'sms' | 'both'>('email');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAICompose, setShowAICompose] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<{
    id: string;
    title: string;
    request_items: Array<{ id: string; tag: string; upload_token: string }>;
  } | null>(null);

  // Optimized callbacks
  const handlePresetChange = useCallback((preset: 'onboarding' | 'renewal') => {
    setSelectedPreset(preset);
    const presetData = PRESETS[preset];
    setTitle(presetData.title);
    setDescription(presetData.description);
    setItems(presetData.items.map((item, index) => ({ id: `preset-${index}`, tag: item })));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: Date.now().toString(), tag: '' }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, tag: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, tag } : item));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    performanceMark('form-submit-start');
    console.log('📝 Form submission started - single server call expected');
    
    if (!formSelectedPropertyId) {
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
      const result = await createRequest({
        propertyId: formSelectedPropertyId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        items: validItems.map(item => item.tag.trim()),
        uploadedFiles: [], // No file uploads in v1
        recipient,
        notification: {
          notifyNow,
          preferredChannel
        }
      });

      if (result.success && result.data) {
        setCreatedRequest(result.data);
        setShowSharePanel(true);
        performanceMark('form-submit-success');
        performanceMeasure('form-submit', 'form-submit-start', 'form-submit-success');
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Request creation error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formSelectedPropertyId, title, description, dueDate, items, recipient, notifyNow, preferredChannel]);

  const handleClose = useCallback(() => {
    performanceMark('form-close');
    console.log('🚪 Form closing - should fully unmount');
    onClose();
  }, [onClose]);

  const handleAIInsert = useCallback((text: string) => {
    setDescription(text);
    setShowAICompose(false);
  }, []);

  const handleAIOpen = useCallback(() => {
    performanceMark('ai-compose-open');
    console.log('🤖 AI Compose opening - lazy loading expected');
    setShowAICompose(true);
  }, []);

  // Success panel
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
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold mb-2">Request Created</h3>
              <p className="text-fg-muted">Your document request has been created successfully.</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Upload Links:</h4>
              {createdRequest.request_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg">
                  <span className="font-medium">{item.tag}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/r/${item.upload_token}`)}
                  >
                    Copy Link
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const allLinks = createdRequest.request_items
                    .map(item => `${item.tag}: ${window.location.origin}/r/${item.upload_token}`)
                    .join('\n');
                  navigator.clipboard.writeText(allLinks);
                }}
                className="flex-1"
              >
                Copy All Links
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // AI Compose modal
  if (showAICompose) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                <p className="text-fg-muted">Loading AI Compose...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <AIComposeModal
          onClose={() => setShowAICompose(false)}
          onInsert={handleAIInsert}
          requestTitle={title || 'Document Request'}
          requestItems={items.filter(item => item.tag.trim()).map(item => item.tag.trim())}
        />
      </Suspense>
    );
  }

  // Main form
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create Document Request</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preset Selector - only when opened from Onboarding & Renewals */}
            {showPresetSelector && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Request Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedPreset === 'onboarding' ? 'primary' : 'secondary'}
                    onClick={() => handlePresetChange('onboarding')}
                    className="flex-1"
                  >
                    Onboarding
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPreset === 'renewal' ? 'primary' : 'secondary'}
                    onClick={() => handlePresetChange('renewal')}
                    className="flex-1"
                  >
                    Renewal
                  </Button>
                </div>
              </div>
            )}

            {/* Property Selector - only when opened from Onboarding & Renewals */}
            {showPresetSelector && (
              <div className="space-y-2">
                <Label htmlFor="property" className="text-sm font-medium">Property *</Label>
                <select
                  id="property"
                  value={formSelectedPropertyId}
                  onChange={(e) => setFormSelectedPropertyId(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-bg"
                  required
                >
                  <option value="">Select a property</option>
                  {memoizedProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Property Display - when opened from property page */}
            {!showPresetSelector && formSelectedPropertyId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Property</Label>
                <div className="p-2 bg-bg-subtle rounded-md">
                  {memoizedProperties.find(p => p.id === formSelectedPropertyId)?.name || 'Selected Property'}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter request title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAIOpen}
                  className="text-brand hover:text-brand-600"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter request description"
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Required Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Required Documents *</Label>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      value={item.tag}
                      onChange={(e) => updateItem(item.id, e.target.value)}
                      placeholder="Enter document name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Document
              </Button>
            </div>

            {/* Recipient */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Recipient (Optional)</Label>
              
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-sm font-medium">Name</Label>
                <Input
                  id="recipientName"
                  value={recipient.name}
                  onChange={(e) => setRecipient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter recipient name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="text-sm font-medium">Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipient.email}
                  onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientPhone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={recipient.phone}
                  onChange={(e) => setRecipient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Notification Settings */}
            {(recipient.email || recipient.phone) && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyNow"
                    checked={notifyNow}
                    onChange={(e) => setNotifyNow(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="notifyNow" className="text-sm font-medium">
                    Send notification now
                  </Label>
                </div>

                {notifyNow && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preferred Channel</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={preferredChannel === 'email' ? 'primary' : 'secondary'}
                        onClick={() => setPreferredChannel('email')}
                        disabled={!recipient.email}
                        className="flex-1"
                      >
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant={preferredChannel === 'sms' ? 'primary' : 'secondary'}
                        onClick={() => setPreferredChannel('sms')}
                        disabled={!recipient.phone}
                        className="flex-1"
                      >
                        SMS
                      </Button>
                      <Button
                        type="button"
                        variant={preferredChannel === 'both' ? 'primary' : 'secondary'}
                        onClick={() => setPreferredChannel('both')}
                        disabled={!recipient.email || !recipient.phone}
                        className="flex-1"
                      >
                        Both
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2">
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