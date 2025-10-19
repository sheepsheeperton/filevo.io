"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/format';
import { Download, Eye } from 'lucide-react';

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

interface AuditFileTableProps {
  data: File[];
}

export function AuditFileTable({ data }: AuditFileTableProps) {
  const getFileTypeBadge = (fileName: string, tag: string | null) => {
    const text = `${fileName} ${tag || ''}`.toLowerCase();
    
    if (/lease/i.test(text)) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Lease</Badge>;
    } else if (/receipt|invoice/i.test(text)) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Receipt</Badge>;
    } else if (/insurance|certificate/i.test(text)) {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Insurance</Badge>;
    } else if (/\bw-?9\b/i.test(text)) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">W-9</Badge>;
    } else {
      return <Badge variant="secondary">Other</Badge>;
    }
  };

  const handleViewFile = (file: File) => {
    // This would open your existing file preview modal
    console.log('View file:', file.file_name);
  };

  const handleDownloadFile = (file: File) => {
    // This would trigger file download
    console.log('Download file:', file.file_name);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="text-fg-muted">
              <svg
                className="mx-auto h-12 w-12 text-fg-subtle"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-fg-muted">No audit files found</h3>
              <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">
                Adjust your filters or create requests to generate audit documentation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Date</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Property</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Tag</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">File</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Type</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Uploader</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Source</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((file) => (
                <tr key={file.id} className="border-b border-border hover:bg-elev/50">
                  <td className="px-6 py-4 text-sm text-fg">
                    {fmtDate(file.uploaded_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg">
                    {file.request_items?.requests.properties.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg">
                    {file.request_items?.tag || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg">
                    <div className="max-w-xs truncate" title={file.file_name}>
                      {file.file_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getFileTypeBadge(file.file_name, file.request_items?.tag || null)}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg">
                    {file.uploaded_by || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg">
                    <div className="max-w-xs truncate" title={file.request_items?.requests.title || 'Unknown'}>
                      {file.request_items?.requests.title || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(file)}
                        title="View File"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        title="Download File"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
