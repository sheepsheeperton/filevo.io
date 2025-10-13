'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function UploadForm({ 
  itemId, 
  token,
  propertyId,
  tag 
}: { 
  itemId: string; 
  token: string;
  propertyId: string;
  tag: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'uploading'|'done'|'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    setProgress(0);

    try {
      // Get signed upload URL from server
      const urlRes = await fetch('/api/upload/get-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          tag,
          fileName: file.name,
          itemId,
          token,
        }),
      });

      if (!urlRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { signedUrl, path } = await urlRes.json();

      // Upload file to storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      setProgress(50);

      // Record file in database
      const recordRes = await fetch('/api/upload/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          token,
          fileName: file.name,
          storagePath: path,
        }),
      });

      if (!recordRes.ok) {
        throw new Error('Failed to record upload');
      }

      setProgress(100);
      setStatus('done');
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  }

  return (
    <div className="space-y-4">
      {status === 'done' ? (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Upload successful!</span>
          </div>
          <p className="text-sm mt-1">Thank you for uploading your document. You may upload additional files if needed.</p>
        </div>
      ) : null}

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Select File
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 bg-elev border border-border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand file:text-black file:cursor-pointer hover:file:bg-brand-600"
          disabled={status === 'uploading'}
        />
        {file && (
          <p className="text-sm text-fg-muted mt-2">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {status === 'uploading' && (
        <div>
          <div className="w-full bg-elev rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-fg-muted mt-2">Uploading...</p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        className="w-full"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload File'}
      </Button>

      {status === 'done' && (
        <Button
          variant="ghost"
          onClick={() => setStatus('idle')}
          className="w-full"
        >
          Upload Another File
        </Button>
      )}
    </div>
  );
}

