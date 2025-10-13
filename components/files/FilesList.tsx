'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileData {
  id: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
  request_item: {
    id: string;
    tag: string;
    status: string;
    request: {
      id: string;
      title: string;
      property_id: string;
    }[];
  }[];
}

export function FilesList({ files }: { files: FileData[]; propertyId: string }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Group files by request
  const filesByRequest = files.reduce((acc, file) => {
    const item = file.request_item[0];
    if (!item) return acc;
    
    const request = item.request[0];
    if (!request) return acc;
    
    const requestId = request.id;
    if (!acc[requestId]) {
      acc[requestId] = {
        title: request.title,
        files: [],
      };
    }
    acc[requestId].files.push(file);
    return acc;
  }, {} as Record<string, { title: string; files: FileData[] }>);

  const handleDownload = async (fileId: string, storagePath: string) => {
    setDownloading(fileId);
    try {
      const res = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      });

      if (!res.ok) throw new Error('Download failed');

      const { signedUrl } = await res.json();
      
      // Open in new tab
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Object.keys(filesByRequest).length > 0 && (
          <span className="text-sm text-fg-muted self-center">
            {Object.keys(filesByRequest).length} {Object.keys(filesByRequest).length === 1 ? 'request' : 'requests'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(filesByRequest).map(([requestId, { title, files: requestFiles }]) => (
          <Card key={requestId}>
            <CardContent className="py-4">
              <h3 className="font-medium mb-3">{title}</h3>
              <div className="space-y-2">
                {requestFiles.map((file) => {
                  const item = file.request_item[0];
                  if (!item) return null;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-elev rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <svg
                          className="h-5 w-5 text-fg-subtle flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{file.file_name}</div>
                          <div className="text-xs text-fg-muted">
                            {item.tag} · Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file.id, file.storage_path)}
                        disabled={downloading === file.id}
                      >
                        {downloading === file.id ? 'Loading...' : 'Download'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

