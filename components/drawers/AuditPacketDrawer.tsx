"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { fmtDate } from '@/lib/format';
import { X, ChevronLeft, ChevronRight, Download, Link, FileText } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface File {
  id: string;
  file_name: string;
  uploaded_at: string;
  uploaded_by: string | null;
  request_item_id: string;
  request_items: {
    id: string;
    tag: string;
    request_id: string;
    requests: {
      id: string;
      title: string;
      property_id: string;
      properties: {
        id: string;
        name: string;
      };
    };
  } | null;
}

interface AuditPacketDrawerProps {
  onClose: () => void;
  onPacketCreated: (packet: { id: string; name: string; timestamp: string; link?: string }) => void;
  properties: Property[];
  files: File[];
}

type Step = 'scope' | 'include' | 'review' | 'export';

const matchers = {
  lease: /lease/i,
  receipt: /receipt|invoice/i,
  insurance: /insurance|certificate/i,
  w9: /\bw-?9\b/i,
  other: /.*/
};

export function AuditPacketDrawer({ onClose, onPacketCreated, properties, files }: AuditPacketDrawerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('scope');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [includeTypes, setIncludeTypes] = useState({
    lease: false,
    receipt: false,
    insurance: false,
    w9: false,
    other: false
  });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [packetName, setPacketName] = useState('');

  // Filter files based on scope and include settings
  const matchingFiles = useMemo(() => {
    let filtered = files;

    // Filter by selected properties
    if (selectedProperties.length > 0) {
      filtered = filtered.filter(f => f.request_items && selectedProperties.includes(f.request_items.requests.properties.id));
    }

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) <= new Date(dateRange.to));
    }

    // Filter by file types
    const activeTypes = Object.entries(includeTypes)
      .filter(([, included]) => included)
      .map(([type]) => type);

    if (activeTypes.length > 0) {
      filtered = filtered.filter(f => {
        return f.request_items && activeTypes.some(type => {
          const matcher = matchers[type as keyof typeof matchers];
          return matcher.test(f.file_name) || matcher.test(f.request_items!.tag);
        });
      });
    }

    return filtered;
  }, [files, selectedProperties, dateRange, includeTypes]);

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleIncludeTypeToggle = (type: keyof typeof includeTypes) => {
    setIncludeTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAllFiles = () => {
    setSelectedFiles(matchingFiles.map(f => f.id));
  };

  const handleDeselectAllFiles = () => {
    setSelectedFiles([]);
  };

  const nextStep = () => {
    const steps: Step[] = ['scope', 'include', 'review', 'export'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['scope', 'include', 'review', 'export'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const generatePacket = () => {
    const packet = {
      id: Date.now().toString(),
      name: packetName || `Audit Packet ${new Date().toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
      link: `#packet-${Date.now()}` // This would be a real download link
    };
    
    onPacketCreated(packet);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'scope':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Select Properties</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {properties.map(property => (
                  <label key={property.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-elev/50 cursor-pointer">
                    <Checkbox
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={() => handlePropertyToggle(property.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{property.name}</div>
                      <div className="text-sm text-fg-muted">{property.address}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Date Range</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'include':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Include File Types</Label>
              <div className="space-y-3">
                {Object.entries(includeTypes).map(([type, included]) => (
                  <label key={type} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-elev/50 cursor-pointer">
                    <Checkbox
                      checked={included}
                      onCheckedChange={() => handleIncludeTypeToggle(type as keyof typeof includeTypes)}
                    />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{type === 'w9' ? 'W-9' : type}</div>
                      <div className="text-sm text-fg-muted">
                        {type === 'lease' && 'Lease agreements and rental documents'}
                        {type === 'receipt' && 'Receipts, invoices, and payment records'}
                        {type === 'insurance' && 'Insurance certificates and policies'}
                        {type === 'w9' && 'W-9 forms and tax documents'}
                        {type === 'other' && 'All other file types'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-sm text-fg-muted">
                <strong>{matchingFiles.length}</strong> files match your criteria
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Review Files</Label>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleSelectAllFiles}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDeselectAllFiles}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matchingFiles.map(file => (
                <label key={file.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-elev/50 cursor-pointer">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => handleFileToggle(file.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.file_name}</div>
                    <div className="text-sm text-fg-muted">
                      {file.request_items?.requests.properties.name || 'Unknown'} • {file.request_items?.tag || 'Unknown'} • {fmtDate(file.uploaded_at)}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-sm text-fg-muted">
                <strong>{selectedFiles.length}</strong> files selected for export
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="packet-name">Packet Name</Label>
              <Input
                id="packet-name"
                value={packetName}
                onChange={(e) => setPacketName(e.target.value)}
                placeholder="e.g., Q4 2024 Audit Packet"
              />
            </div>

            <div className="space-y-4">
              <Label>Export Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={generatePacket} className="h-20 flex flex-col items-center justify-center">
                  <Download className="h-6 w-6 mb-2" />
                  Generate ZIP
                </Button>
                <Button variant="secondary" className="h-20 flex flex-col items-center justify-center">
                  <Link className="h-6 w-6 mb-2" />
                  Create Shareable Link
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Additional Exports</Label>
              <Button variant="secondary" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Export CSV Manifest
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'scope': return '1. Scope';
      case 'include': return '2. Include';
      case 'review': return '3. Review';
      case 'export': return '4. Export';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'scope': return selectedProperties.length > 0;
      case 'include': return Object.values(includeTypes).some(Boolean);
      case 'review': return selectedFiles.length > 0;
      case 'export': return true;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{getStepTitle()}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between pt-6 border-t border-border">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 'scope'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep === 'export' ? (
              <Button onClick={generatePacket}>
                Create Packet
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
