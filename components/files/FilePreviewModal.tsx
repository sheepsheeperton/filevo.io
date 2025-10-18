'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilePreviewModalProps {
  file: {
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
  };
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = file.request_item[0];
  const request = item?.request[0];

  // Get file extension to determine file type
  const fileExtension = file.file_name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    if (isOpen && !signedUrl) {
      loadFile();
    }
  }, [isOpen]);

  const loadFile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: file.storage_path }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load file');
      }

      const { signedUrl: url } = await res.json();
      setSignedUrl(url);
    } catch (err) {
      console.error('Error loading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{file.file_name}</CardTitle>
              <p className="text-sm text-fg-muted mt-1">
                {item?.tag} · {request?.title} · Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {signedUrl && (
                <Button onClick={handleDownload} variant="secondary" size="sm">
                  Download
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
                <p className="text-fg-muted">Loading file...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-danger">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Failed to load file</h3>
                  <p className="text-sm text-fg-muted mt-2">{error}</p>
                  <Button onClick={loadFile} className="mt-4" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {signedUrl && !loading && !error && (
            <div className="flex-1 overflow-hidden">
              {isImage ? (
                <div className="h-full flex items-center justify-center bg-elev rounded-lg">
                  <img 
                    src={signedUrl} 
                    alt={file.file_name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : isPdf ? (
                <div className="h-full">
                  <iframe 
                    src={signedUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title={file.file_name}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-elev rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="text-fg-subtle">
                      <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{file.file_name}</h3>
                      <p className="text-sm text-fg-muted mt-2">
                        This file type cannot be previewed inline. Click Download to view the file.
                      </p>
                      <Button onClick={handleDownload} className="mt-4">
                        Download File
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
