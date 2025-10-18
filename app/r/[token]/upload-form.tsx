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

  // Accepted file types
  const acceptedTypes = {
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB';
    }
    
    if (!acceptedTypes[file.type as keyof typeof acceptedTypes]) {
      return 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files.';
    }
    
    return null;
  };

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
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              const validationError = validateFile(selectedFile);
              if (validationError) {
                setError(validationError);
                setFile(null);
                return;
              }
              setError(null);
              setFile(selectedFile);
            } else {
              setFile(null);
            }
          }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          className="w-full px-3 py-2 bg-elev border border-border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand file:text-black file:cursor-pointer hover:file:bg-brand-600"
          disabled={status === 'uploading'}
        />
        {file && (
          <div className="mt-2 p-3 bg-elev rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="text-brand">
                {file.type.startsWith('image/') ? '🖼️' : '📄'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-fg-muted">
                  {acceptedTypes[file.type as keyof typeof acceptedTypes]} • {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-fg-muted mt-2">
          Accepted formats: PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB)
        </p>
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

