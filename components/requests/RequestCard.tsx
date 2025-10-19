'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditRequestModal } from './EditRequestModal';
import { ResendNotificationModal } from './ResendNotificationModal';
import { RequestActions } from './RequestActions';

interface RequestItem {
  id: string;
  tag: string;
  status: 'pending' | 'received' | 'past_due';
  upload_token: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  archived_at?: string | null;
  request_items: RequestItem[];
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  notify_pref?: string | null;
  notified_at?: string | null;
}

export function RequestCard({ request }: { request: Request; propertyId: string }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  
  const pending = request.request_items.filter((i) => i.status === 'pending').length;
  const received = request.request_items.filter((i) => i.status === 'received').length;
  const total = request.request_items.length;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <>
    <Card>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-lg">{request.title}</h3>
            {request.description && (
              <p className="text-sm text-fg-muted mt-2">{request.description}</p>
            )}
            {request.due_date && (
              <p className="text-sm text-fg-subtle mt-2">
                Due: {new Date(request.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-right mr-4">
              <div className="font-mono text-fg-subtle">
                {received}/{total} received
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowResendModal(true)}
              >
                Resend
              </Button>
              <RequestActions 
                requestId={request.id}
                isArchived={!!request.archived_at}
                hasFiles={false} // TODO: Check if files exist
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {request.request_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-elev rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'received'
                      ? 'bg-success'
                      : item.status === 'past_due'
                      ? 'bg-danger'
                      : 'bg-warning'
                  }`}
                />
                <span className="text-sm">{item.tag}</span>
              </div>
              {item.upload_token && (
                <a
                  href={`${baseUrl}/r/${item.upload_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:underline"
                >
                  Upload Link →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-fg-subtle">
          <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
          {pending > 0 && (
            <span className="text-warning">{pending} pending</span>
          )}
          {request.notified_at && (
            <span className="text-success">Notified</span>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Edit Modal */}
    {showEditModal && (
      <EditRequestModal
        request={request}
        onClose={() => setShowEditModal(false)}
      />
    )}

    {/* Resend Modal */}
    {showResendModal && (
      <ResendNotificationModal
        request={request}
        onClose={() => setShowResendModal(false)}
      />
    )}
  </>
  );
}

