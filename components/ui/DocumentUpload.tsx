'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

interface DocumentUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  mode?: 'default' | 'request-attachment';
  requestId?: string;
  onUploadComplete?: (file: UploadedFile, storagePath: string) => void;
  onUploadError?: (error: string) => void;
}

// Memoize accepted types to prevent recreation
const ACCEPTED_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({ 
  files, 
  onFilesChange, 
  maxFiles = 10,
  acceptedTypes = ACCEPTED_TYPES,
  className,
  mode = 'default',
  requestId,
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize file validation to prevent recreation
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large (max 10MB)`;
    }
    if (!acceptedTypes.includes(file.type)) {
      return `${file.name} is not a supported file type`;
    }
    return null;
  }, [acceptedTypes]);

  // Upload file for request attachments
  const uploadRequestAttachment = useCallback(async (file: File): Promise<string | null> => {
    if (!requestId) {
      onUploadError?.('Request ID is required for upload');
      return null;
    }

    try {
      // Get signed upload URL
      const response = await fetch('/api/upload/get-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          origin: 'request_attachment',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        onUploadError?.(errorText);
        return null;
      }

      const { signedUrl, path } = await response.json();

      // Upload file to signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        onUploadError?.('Failed to upload file to storage');
        return null;
      }

      // Record the file in database
      const recordResponse = await fetch('/api/upload/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          fileName: file.name,
          storagePath: path,
          tag: 'attachment',
          origin: 'request_attachment',
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!recordResponse.ok) {
        const errorText = await recordResponse.text();
        onUploadError?.(errorText);
        return null;
      }

      return path;
    } catch (error) {
      console.error('Error uploading request attachment:', error);
      onUploadError?.('Failed to upload file');
      return null;
    }
  }, [requestId, onUploadError]);

  // Process file for request attachment mode
  const processFileForRequestAttachment = useCallback(async (file: File): Promise<UploadedFile | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      return null;
    }

    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      file,
    };

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      uploadedFile.preview = URL.createObjectURL(file);
    }

    // Upload the file
    const storagePath = await uploadRequestAttachment(file);
    if (!storagePath) {
      return null;
    }

    onUploadComplete?.(uploadedFile, storagePath);
    return uploadedFile;
  }, [validateFile, uploadRequestAttachment, onUploadComplete, onUploadError]);

  // Optimize file processing with debounced preview generation
  const processFile = useCallback((file: File): UploadedFile => {
    const uploadedFile: UploadedFile = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      // Only create preview for images and defer it
      preview: file.type.startsWith('image/') ? undefined : undefined
    };

    // Create preview asynchronously to avoid blocking
    if (file.type.startsWith('image/')) {
      setTimeout(() => {
        try {
          const preview = URL.createObjectURL(file);
          uploadedFile.preview = preview;
          // Trigger re-render with new preview
          onFilesChange([...files]);
        } catch (error) {
          console.warn('Failed to create image preview:', error);
        }
      }, 0);
    }

    return uploadedFile;
  }, [files, onFilesChange]);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    // Process files based on mode
    for (const file of Array.from(selectedFiles)) {
      // Check max files
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        continue;
      }

      if (mode === 'request-attachment') {
        const uploadedFile = await processFileForRequestAttachment(file);
        if (uploadedFile) {
          newFiles.push(uploadedFile);
        }
      } else {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
          continue;
        }
        newFiles.push(processFile(file));
      }
    }

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, maxFiles, mode, validateFile, processFile, processFileForRequestAttachment, onFilesChange, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  // Delete request attachment
  const deleteRequestAttachment = useCallback(async (file: UploadedFile) => {
    if (!requestId || !file.preview) return; // preview contains storage path for request attachments

    try {
      const response = await fetch(`/api/files?requestId=${requestId}&path=${encodeURIComponent(file.preview)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        onUploadError?.('Failed to delete file');
        return;
      }

      // Remove from local state
      removeFile(file.id);
    } catch (error) {
      console.error('Error deleting request attachment:', error);
      onUploadError?.('Failed to delete file');
    }
  }, [requestId, removeFile, onUploadError]);

  const getFileIcon = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver 
            ? "border-brand bg-brand/5" 
            : "border-border hover:border-brand/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-8 w-8 text-fg-muted mb-2" />
        <p className="text-sm text-fg-muted mb-2">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-brand hover:underline"
          >
            browse to upload
          </button>
        </p>
        <p className="text-xs text-fg-subtle">
          PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP (max 10MB each)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-fg">Uploaded Documents ({files.length})</h4>
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {uploadedFile.preview ? (
                        <Image
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-elev flex items-center justify-center">
                          {getFileIcon(uploadedFile.file)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg truncate">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => mode === 'request-attachment' ? deleteRequestAttachment(uploadedFile) : removeFile(uploadedFile.id)}
                      className="text-fg-muted hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
