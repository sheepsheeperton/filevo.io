"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryChips } from '@/components/ui/CategoryChips';
import { inferCategoryFromRequest } from '@/lib/categories';
import { fmtDate } from '@/lib/format';
import { AuditPacketDrawer } from '@/components/drawers/AuditPacketDrawer';
import { AuditFileTable } from '@/components/tables/AuditFileTable';
import { FolderArchive, Download, FileText } from 'lucide-react';

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

interface AuditClientProps {
  properties: Property[];
  requests: Request[];
  files: File[];
}

interface RecentPacket {
  id: string;
  name: string;
  timestamp: string;
  link?: string;
}

export function AuditClient({ properties, requests, files }: AuditClientProps) {
  const [showPacketDrawer, setShowPacketDrawer] = useState(false);
  const [recentPackets, setRecentPackets] = useState<RecentPacket[]>([]);
  const [filters, setFilters] = useState({
    property: '',
    fileType: '',
    dateFrom: '',
    dateTo: ''
  });

  // Load recent packets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('audit-packets');
    if (saved) {
      try {
        setRecentPackets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved packets:', e);
      }
    }
  }, []);

  // Save recent packets to localStorage
  const saveRecentPacket = (packet: RecentPacket) => {
    const updated = [packet, ...recentPackets.slice(0, 9)]; // Keep last 10
    setRecentPackets(updated);
    localStorage.setItem('audit-packets', JSON.stringify(updated));
  };

  // Filter audit-related files
  const auditFiles = useMemo(() => {
    return files.filter(f => {
      if (!f.request_items) return false;
      const request = requests.find(r => r.id === f.request_items!.requests.id);
      return request && inferCategoryFromRequest(request) === 'audit';
    });
  }, [files, requests]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = auditFiles;

    if (filters.property) {
      filtered = filtered.filter(f => f.request_items?.requests.properties.id === filters.property);
    }

    if (filters.fileType) {
      const matchers = {
        lease: /lease/i,
        receipt: /receipt|invoice/i,
        insurance: /insurance|certificate/i,
        w9: /\bw-?9\b/i,
        other: /.*/
      };
      
      const matcher = matchers[filters.fileType as keyof typeof matchers];
      if (matcher) {
        filtered = filtered.filter(f => 
          f.request_items && (
            matcher.test(f.file_name) || matcher.test(f.request_items.tag)
          )
        );
      }
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(f => new Date(f.uploaded_at) <= new Date(filters.dateTo));
    }

    return filtered;
  }, [auditFiles, filters]);

  const handleCreateAuditPacket = () => {
    setShowPacketDrawer(true);
  };

  const handlePacketCreated = (packet: RecentPacket) => {
    saveRecentPacket(packet);
    setShowPacketDrawer(false);
  };

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'Property', 'Tag', 'File', 'Uploader', 'Source'].join(','),
      ...filteredData.map(f => [
        fmtDate(f.uploaded_at),
        f.request_items?.requests.properties.name || 'Unknown',
        f.request_items?.tag || 'Unknown',
        f.file_name,
        f.uploaded_by || 'Unknown',
        f.request_items?.requests.title || 'Unknown'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-files.csv';
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
          <h1 className="text-3xl font-semibold">Ownership / Accounting / Audit</h1>
          <p className="text-fg-muted mt-2">Build audit packets and manage financial documentation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateAuditPacket} className="bg-violet-600 hover:bg-violet-700 text-white">
            <FolderArchive className="h-4 w-4 mr-2" />
            Create Audit Packet
          </Button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="space-y-4">
        <CategoryChips 
          value="audit" 
          onChange={() => {}} // Fixed to audit
          showAll={false}
        />
      </div>

      {/* Recent Packets */}
      {recentPackets.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Packets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPackets.map((packet) => (
                <div key={packet.id} className="p-4 bg-surface rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-fg">{packet.name}</h4>
                      <p className="text-sm text-fg-muted mt-1">
                        {fmtDate(packet.timestamp)}
                      </p>
                    </div>
                    {packet.link && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={packet.link} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Repository */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Repository</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <Label htmlFor="file-type-filter">File Type</Label>
              <select
                id="file-type-filter"
                value={filters.fileType}
                onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-fg"
              >
                <option value="">All Types</option>
                <option value="lease">Lease</option>
                <option value="receipt">Receipt</option>
                <option value="insurance">Insurance</option>
                <option value="w9">W-9</option>
                <option value="other">Other</option>
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

          {/* Table */}
          <AuditFileTable data={filteredData} />

          {/* Export Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={exportCSV} variant="secondary">
              <FileText className="h-4 w-4 mr-2" />
              Export CSV Manifest
            </Button>
            <Button onClick={exportZIP} variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Generate ZIP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packet Drawer */}
      {showPacketDrawer && (
        <AuditPacketDrawer
          onClose={() => setShowPacketDrawer(false)}
          onPacketCreated={handlePacketCreated}
          properties={properties}
          files={auditFiles}
        />
      )}
    </div>
  );
}
