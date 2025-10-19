"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/format';
import { Eye, Copy, Send } from 'lucide-react';

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

interface MaintenanceTableProps {
  data: File[];
}

export function MaintenanceTable({ data }: MaintenanceTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Received</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleViewFiles = (file: File) => {
    // This would open your existing file preview modal
    console.log('View file:', file.file_name);
  };

  const handleCopyLink = (file: File) => {
    // This would copy the public upload link
    const link = `${window.location.origin}/r/${file.request_item_id}`;
    navigator.clipboard.writeText(link);
    // You might want to show a toast notification here
  };

  const handleResendReminder = (file: File) => {
    // This would trigger your existing reminder function
    console.log('Resend reminder for:', file.request_items?.requests.title || 'Unknown');
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
              <h3 className="text-lg font-medium text-fg-muted">No maintenance receipts found</h3>
              <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">
                Upload receipts or request vendor documentation to get started
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
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Vendor</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Files</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-fg-muted">Notes</th>
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
                    <div className="flex items-center gap-2">
                      <span className="text-fg-muted">1 file</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFiles(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge('pending')} {/* Status would need to be determined from the request */}
                  </td>
                  <td className="px-6 py-4 text-sm text-fg-muted">
                    —
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(file)}
                        title="Copy Request Link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendReminder(file)}
                        title="Resend Reminder"
                      >
                        <Send className="h-4 w-4" />
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
