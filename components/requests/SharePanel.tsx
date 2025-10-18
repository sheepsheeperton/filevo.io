'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SharePanelProps {
  request: any;
  onClose: () => void;
  notificationSent: boolean;
}

export function SharePanel({ request, onClose, notificationSent }: SharePanelProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllLinks = async () => {
    const allLinks = request.request_items?.map((item: any) => 
      `${item.tag}: ${window.location.origin}/r/${item.upload_token}`
    ).join('\n\n') || '';
    
    try {
      await navigator.clipboard.writeText(allLinks);
      // Show success feedback
    } catch (err) {
      console.error('Failed to copy all links:', err);
    }
  };

  const getUploadLink = (token: string) => {
    return `${window.location.origin}/r/${token}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Request Created Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Status */}
          {notificationSent && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-success">
                  Notification sent successfully
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-1">
                The recipient has been notified via the selected channel
              </p>
            </div>
          )}

          {/* Share Links */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Upload Links</h3>
              <Button onClick={copyAllLinks} variant="secondary" size="sm">
                Copy all links
              </Button>
            </div>
            
            <div className="space-y-3">
              {request.request_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-elev rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.tag}</p>
                    <p className="text-xs text-fg-muted truncate">
                      {getUploadLink(item.upload_token)}
                    </p>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(getUploadLink(item.upload_token), item.id)}
                    variant="ghost"
                    size="sm"
                  >
                    {copiedItems.has(item.id) ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-elev rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Next Steps</h4>
            <ul className="text-xs text-fg-muted space-y-1">
              <li>• Share the upload links with the recipient</li>
              <li>• Recipients can upload documents using the secure links</li>
              <li>• You'll receive notifications when documents are uploaded</li>
              <li>• Track progress in the requests section</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
