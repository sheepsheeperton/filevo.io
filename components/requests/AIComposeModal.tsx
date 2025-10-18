'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AIComposeModalProps {
  onClose: () => void;
  onInsert: (text: string) => void;
  requestTitle: string;
  requestItems: string[];
}

export function AIComposeModal({ onClose, onInsert, requestTitle, requestItems }: AIComposeModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedSMS, setGeneratedSMS] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateContent = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate AI generation (replace with actual OpenAI API call)
      const response = await fetch('/api/ai/compose-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestTitle,
          requestItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedEmail(data.email || '');
      setGeneratedSMS(data.sms || '');
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      // Fallback content for demo
      setGeneratedEmail(`Hi there,

I hope this message finds you well. I'm reaching out regarding the document request for "${requestTitle}".

Please upload the following documents:
${requestItems.map(item => `• ${item}`).join('\n')}

You can upload these documents using the secure link provided. If you have any questions or need assistance, please don't hesitate to reach out.

Thank you for your prompt attention to this matter.

Best regards,
Property Management Team`);

      setGeneratedSMS(`Hi! Please upload these documents for "${requestTitle}": ${requestItems.join(', ')}. Use the secure link provided. Questions? Reply to this message.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertEmail = () => {
    onInsert(generatedEmail);
  };

  const handleCopySMS = () => {
    navigator.clipboard.writeText(generatedSMS);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Generate Email & SMS with AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Request Details</Label>
              <div className="mt-1 p-3 bg-elev rounded-lg text-sm">
                <p><strong>Title:</strong> {requestTitle}</p>
                <p><strong>Documents:</strong> {requestItems.join(', ')}</p>
              </div>
            </div>

            <Button
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Email & SMS'}
            </Button>

            {generatedEmail && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Generated Email</Label>
                    <Button
                      onClick={handleInsertEmail}
                      variant="secondary"
                      size="sm"
                    >
                      Insert into Description
                    </Button>
                  </div>
                  <textarea
                    value={generatedEmail}
                    readOnly
                    rows={8}
                    className="w-full px-3 py-2 bg-elev border border-border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Generated SMS</Label>
                    <Button
                      onClick={handleCopySMS}
                      variant="secondary"
                      size="sm"
                    >
                      Copy SMS
                    </Button>
                  </div>
                  <textarea
                    value={generatedSMS}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 bg-elev border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
