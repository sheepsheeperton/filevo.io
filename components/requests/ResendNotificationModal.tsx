'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resendNotification } from '@/app/app/property/[id]/requests/actions';

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
  request_items: RequestItem[];
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  notify_pref?: string | null;
  notified_at?: string | null;
}

interface ResendNotificationModalProps {
  request: Request;
  propertyId: string;
  onClose: () => void;
}

export function ResendNotificationModal({ request, onClose }: ResendNotificationModalProps) {
  const [recipientName, setRecipientName] = useState(request.recipient_name || '');
  const [recipientEmail, setRecipientEmail] = useState(request.recipient_email || '');
  const [recipientPhone, setRecipientPhone] = useState(request.recipient_phone || '');
  const [preferredChannel, setPreferredChannel] = useState<'email' | 'sms' | 'both'>(
    (request.notify_pref as 'email' | 'sms' | 'both') || 'email'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canNotify = recipientEmail.trim() || recipientPhone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await resendNotification({
        requestId: request.id,
        recipient: {
          name: recipientName,
          email: recipientEmail,
          phone: recipientPhone,
        },
        notification: {
          notifyNow: true,
          preferredChannel,
        },
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Resend notification error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <Card className="w-full max-w-md my-8">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Notification sent successfully!</span>
              </div>
              <p className="text-sm text-fg-muted">This window will close automatically...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <CardTitle>Resend Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-info/10 border border-info/20 text-info px-4 py-3 rounded-lg text-sm">
              <p><strong>Request:</strong> {request.title}</p>
              <p><strong>Documents:</strong> {request.request_items.map(item => item.tag).join(', ')}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fg">Recipient Information</h3>
              
              <div>
                <Label htmlFor="recipientName" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="recipientName"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1"
                  placeholder="Recipient's name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientEmail" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="mt-1"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientPhone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fg">Notification Settings</h3>
              
              <div>
                <Label className="text-sm font-medium">Preferred channel</Label>
                <div className="mt-2 space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="channel"
                      value="email"
                      checked={preferredChannel === 'email'}
                      onChange={(e) => setPreferredChannel(e.target.value as 'email')}
                      disabled={!recipientEmail.trim()}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="channel"
                      value="sms"
                      checked={preferredChannel === 'sms'}
                      onChange={(e) => setPreferredChannel(e.target.value as 'sms')}
                      disabled={!recipientPhone.trim()}
                      className="rounded border-border"
                    />
                    <span className="text-sm">SMS</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="channel"
                      value="both"
                      checked={preferredChannel === 'both'}
                      onChange={(e) => setPreferredChannel(e.target.value as 'both')}
                      disabled={!recipientEmail.trim() || !recipientPhone.trim()}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Both</span>
                  </label>
                </div>
              </div>

              {!canNotify && (
                <p className="text-xs text-fg-muted">
                  Add email or phone number to enable notifications
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !canNotify}
              >
                {isLoading ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
