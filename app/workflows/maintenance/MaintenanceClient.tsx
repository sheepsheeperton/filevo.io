"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inferCategoryFromRequest } from '@/lib/categories';
import { fmtDate } from '@/lib/format';
import { UploadReceiptModal } from '@/components/modals/UploadReceiptModal';
import { RequestModal } from '@/components/requests/RequestModal';
import { MaintenanceTable } from '@/components/tables/MaintenanceTable';
import { Wrench, Upload, FileText } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface RequestItem {
  id: string;
  status: string;
  tag: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  property_id: string | null;
  created_at: string;
  request_items: RequestItem[];
}

interface File {
  id: string;
  file_name: string;
  uploaded_at: string;
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

interface MaintenanceClientProps {
  properties: Property[];
  requests: Request[];
  files: File[];
}

const DEFAULT_MAINT_REQ = {
  title: 'Vendor Invoice / Repair Receipt',
  description: 'Please upload receipts or photos for this repair.',
  items: ['Vendor receipt', 'Repair photos']
};

export function MaintenanceClient({ properties, requests, files }: MaintenanceClientProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filters, setFilters] = useState({
    property: '',
    vendor: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Filter maintenance-related requests
  const maintenanceRequests = useMemo(() => {
    return requests.filter(r => inferCategoryFromRequest(r) === 'maintenance');
  }, [requests]);

  // Filter maintenance-related files
  const maintenanceFiles = useMemo(() => {
    return files.filter(f => {
      if (!f.request_items) return false;
      const request = requests.find(r => r.id === f.request_items!.requests.id);
      return request && inferCategoryFromRequest(request) === 'maintenance';
    });
  }, [files, requests]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = maintenanceFiles;

    if (filters.property) {
      filtered = filtered.filter(f => f.request_items?.requests.properties.id === filters.property);
    }

    if (filters.vendor) {
      filtered = filtered.filter(f => 
        f.file_name.toLowerCase().includes(filters.vendor.toLowerCase()) ||
        (f.request_items?.tag && f.request_items.tag.toLowerCase().includes(filters.vendor.toLowerCase()))
      );
    }

    if (filters.status) {
      const requestIds = maintenanceRequests
        .filter(r => {
          if (filters.status === 'pending') {
            return r.request_items.some(item => item.status === 'pending');
          } else if (filters.status === 'received') {
            return r.request_items.every(item => item.status === 'received');
          }
          return true;
        })
        .map(r => r.id);
      
      filtered = filtered.filter(f => f.request_items && requestIds.includes(f.request_items.requests.id));
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) <= new Date(filters.dateTo));
    }

    return filtered;
  }, [maintenanceFiles, maintenanceRequests, filters]);

  const handleRequestVendorReceipt = () => {
    setShowRequestModal(true);
  };

  const handleUploadReceipt = () => {
    setShowUploadModal(true);
  };

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'Property', 'Vendor', 'File', 'Status', 'Notes'].join(','),
      ...filteredData.map(f => [
        fmtDate(f.uploaded_at),
        f.request_items?.requests.properties.name || 'Unknown',
        f.request_items?.tag || 'Unknown',
        f.file_name,
        'Pending', // Status would need to be determined from the request
        ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maintenance-receipts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportZIP = () => {
    // This would integrate with your existing export functionality
    console.log('Export ZIP functionality would be implemented here');
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Maintenance & Vendor Receipts</h1>
          <p className="text-fg-muted mt-2">Track vendor invoices, repair receipts, and maintenance documentation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRequestVendorReceipt} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Wrench className="h-4 w-4 mr-2" />
            Request Vendor Receipt
          </Button>
          <Button onClick={handleUploadReceipt} variant="secondary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-filter">Property</Label>
              <select
                id="property-filter"
                value={filters.property}
                onChange={(e) => setFilters({ ...filters, property: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-fg"
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-filter">Vendor</Label>
              <Input
                id="vendor-filter"
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                placeholder="Search vendor..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-fg"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <MaintenanceTable data={filteredData} />

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button onClick={exportCSV} variant="secondary">
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={exportZIP} variant="secondary">
          <Upload className="h-4 w-4 mr-2" />
          Download ZIP
        </Button>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadReceiptModal
          onClose={() => setShowUploadModal(false)}
          properties={properties}
        />
      )}

      {showRequestModal && (
        <RequestModal
          onClose={() => setShowRequestModal(false)}
          presetItems={DEFAULT_MAINT_REQ.items}
          properties={properties.map(p => ({ id: p.id, name: p.name }))}
        />
      )}
    </div>
  );
}
