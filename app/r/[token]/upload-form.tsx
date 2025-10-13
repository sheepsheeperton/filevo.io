'use client';
import { useState } from 'react';

export default function UploadForm({ itemId, token }: { itemId: string; token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'uploading'|'done'|'error'>('idle');

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    const body = new FormData();
    body.set('file', file);
    body.set('itemId', itemId);
    body.set('token', token);

    const res = await fetch('/api/upload', { method: 'POST', body });
    if (res.ok) setStatus('done');
    else setStatus('error');
  }

  return (
    <div className="space-y-3">
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} className="px-4 py-2 rounded bg-black text-white" disabled={!file || status==='uploading'}>
        {status === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>
      {status==='done' && <p className="text-green-600">Uploaded. Thanks!</p>}
      {status==='error' && <p className="text-red-600">Upload failed. Try again.</p>}
    </div>
  );
}

