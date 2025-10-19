'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image, File } from 'lucide-react';
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
}

const ACCEPTED_TYPES = [
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
  className 
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      // Check max files
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      newFiles.push(uploadedFile);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
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
                      onClick={() => removeFile(uploadedFile.id)}
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
