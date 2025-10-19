'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentUpload } from '@/components/ui/DocumentUpload';
import { createRequest } from '@/app/app/property/[id]/requests/actions';
import { SharePanel } from './SharePanel';
import { X, Sparkles } from 'lucide-react';

// Lazy load AI Compose modal
const AIComposeModal = lazy(() => import('./AIComposeModal').then(module => ({ default: module.AIComposeModal })));

// Performance instrumentation
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
  selectedPropertyId?: string; // For when called from within a property
  showPresetSelector?: boolean; // Show preset selector when called from Onboarding/Renewals page
}

const PRESET_ONBOARDING = {
  name: 'Onboarding',
  title: 'New Tenant Onboarding',
  description: 'Please provide the following documents for your new lease.',
  items: ['Driver\'s license', 'Signed lease', 'Proof of insurance']
};

const PRESET_RENEWAL = {
  name: 'Renewal',
  title: 'Lease Renewal',
  description: 'Please provide the following documents for your lease renewal.',
  items: ['Signed lease', 'Proof of insurance']
};

export function UnifiedRequestModal({ 
  onClose, 
  presetItems = [], 
  properties, 
  selectedPropertyId: propSelectedPropertyId,
  showPresetSelector = false 
}: RequestModalProps) {
  // Performance tracking
  useEffect(() => {
    performanceMark('modal-mount-start');
    console.log('🚀 Modal mounting - tracking performance');
    
    // Monitor network activity
    const originalFetch = window.fetch;
    let networkCalls = 0;
    
    window.fetch = function(...args) {
      networkCalls++;
      console.log(`🌐 Network call #${networkCalls}:`, args[0]);
      return originalFetch.apply(this, args);
    };
    
    return () => {
      performanceMark('modal-unmount');
      console.log('🏁 Modal unmounting');
      console.log(`📊 Total network calls during modal session: ${networkCalls}`);
      
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState(propSelectedPropertyId || '');
  const [selectedPreset, setSelectedPreset] = useState<'onboarding' | 'renewal'>('onboarding');
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
  const [showAICompose, setShowAICompose] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<{
    id: string;
    title: string;
    request_items: Array<{ id: string; tag: string; upload_token: string }>;
  } | null>(null);

  // Memoize preset data to prevent recreation
  const presetData = useMemo(() => ({
    onboarding: PRESET_ONBOARDING,
    renewal: PRESET_RENEWAL
  }), []);

  // Optimize preset application with useCallback
  const applyPreset = useCallback((preset: typeof PRESET_ONBOARDING) => {
    performanceMark('apply-preset-start');
    setTitle(preset.title);
    setDescription(preset.description);
    setItems(preset.items.map((item, index) => ({ tag: item, id: `preset-${index}` })));
    performanceMark('apply-preset-end');
    performanceMeasure('apply-preset', 'apply-preset-start', 'apply-preset-end');
  }, []);

  // Initialize with preset items or selected preset - OPTIMIZED
  useEffect(() => {
    performanceMark('init-preset-start');
    
    if (presetItems.length > 0) {
      // Legacy preset items from old buttons
      setItems(presetItems.map((item, index) => ({ tag: item, id: `preset-${index}` })));
      setTitle(presetItems.includes('Driver\'s license') ? 'New Tenant Onboarding' : 'Lease Renewal');
      setDescription(presetItems.includes('Driver\'s license') 
        ? 'Please provide the following documents for your new lease.'
        : 'Please provide the following documents for your lease renewal.');
    } else if (showPresetSelector) {
      // New preset selector - start with onboarding preset
      applyPreset(presetData.onboarding);
    } else {
      // Empty form
      setItems([{ tag: '', id: Date.now().toString() }]);
    }
    
    performanceMark('init-preset-end');
    performanceMeasure('init-preset', 'init-preset-start', 'init-preset-end');
  }, [presetItems, showPresetSelector, applyPreset, presetData.onboarding]);

  const handlePresetChange = useCallback((preset: 'onboarding' | 'renewal') => {
    setSelectedPreset(preset);
    applyPreset(presetData[preset]);
  }, [applyPreset, presetData]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { tag: '', id: Date.now().toString() }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, tag: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, tag } : item));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    performanceMark('form-submit-start');
    console.log('📝 Form submission started');
    
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
  };

  const handleClose = useCallback(() => {
    performanceMark('modal-close');
    console.log('🚪 Modal closing');
    onClose();
  }, [onClose]);

  const handleAIInsert = useCallback((text: string) => {
    setDescription(text);
    setShowAICompose(false);
  }, []);

  // Lazy load AI Compose modal only when needed
  const handleAIOpen = useCallback(() => {
    performanceMark('ai-compose-open');
    console.log('🤖 AI Compose opening');
    setShowAICompose(true);
  }, []);

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
              onClose={handleClose}
              notificationSent={false}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {/* Preset Selector - only show when called from Onboarding/Renewals page */}
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

            {/* Property Selector - only show when not called from within a property */}
            {!propSelectedPropertyId && (
              <div className="space-y-2">
                <Label htmlFor="property" className="text-sm font-medium">Property *</Label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3 py-2 bg-elev border border-border rounded-lg text-sm"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Required Documents *</Label>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2">
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
                      className="text-danger hover:text-danger-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="text-brand hover:text-brand-600"
                >
                  + Add Document
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload Documents (Optional)</Label>
              <DocumentUpload
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                maxFiles={5}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyNow"
                  checked={notification.notifyNow}
                  onChange={(e) => setNotification({ ...notification, notifyNow: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="notifyNow" className="text-sm font-medium">
                  Send notification immediately
                </Label>
              </div>

              {notification.notifyNow && (
                <div className="space-y-4 pl-6 border-l-2 border-brand/20">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName" className="text-sm font-medium">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={recipient.name}
                      onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                      placeholder="Enter recipient name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipient.email}
                      onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="recipientPhone"
                      type="tel"
                      value={recipient.phone}
                      onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preferred Channel</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={notification.preferredChannel === 'email' ? 'primary' : 'secondary'}
                        onClick={() => setNotification({ ...notification, preferredChannel: 'email' })}
                        size="sm"
                      >
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant={notification.preferredChannel === 'sms' ? 'primary' : 'secondary'}
                        onClick={() => setNotification({ ...notification, preferredChannel: 'sms' })}
                        size="sm"
                      >
                        SMS
                      </Button>
                      <Button
                        type="button"
                        variant={notification.preferredChannel === 'both' ? 'primary' : 'secondary'}
                        onClick={() => setNotification({ ...notification, preferredChannel: 'both' })}
                        size="sm"
                      >
                        Both
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
