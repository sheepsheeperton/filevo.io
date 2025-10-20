import { supabaseServer } from './supabase/server';
import { ulid } from 'ulid';

/**
 * Storage helpers for Supabase Storage
 * 
 * BUCKET: 'documents' (private)
 * Path structure: {propertyId}/{tag}/{ulid}-{originalName}
 * All access via signed URLs
 */

const BUCKET_NAME = 'files'; // Updated to match the actual bucket name
const DOWNLOAD_EXPIRES_IN = 3600; // 1 hour

export interface SignedUploadUrlParams {
  propertyId: string;
  tag: string;
  fileName: string;
}

export interface SignedUploadUrlForRequestAttachmentParams {
  requestId: string;
  fileName: string;
}

/**
 * Generate a signed upload URL for a request attachment
 * Server-only function (uses service role)
 */
export async function getSignedUploadUrlForRequestAttachment({ 
  requestId, 
  fileName 
}: SignedUploadUrlForRequestAttachmentParams): Promise<{ 
  path: string; 
  signedUrl: string; 
  token: string;
} | null> {
  try {
    console.log('getSignedUploadUrlForRequestAttachment called with:', { requestId, fileName });
    
    const db = await supabaseServer();
    
    // Generate unique ID and path: {requestId}/{timestamp}-{random}.{ext}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop() || '';
    const path = `${requestId}/${timestamp}-${random}.${extension}`;
    
    console.log('Generated path for request attachment:', path);
    
    // Generate signed upload URL
    const { data, error } = await db.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    console.log('Supabase storage response for request attachment:', { data, error });

    if (error) {
      console.error('Error creating signed upload URL for request attachment:', error);
      return null;
    }

    return {
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    };
  } catch (error) {
    console.error('Exception in getSignedUploadUrlForRequestAttachment:', error);
    return null;
  }
}
/**
 * Generate a signed upload URL for a file
 * Server-only function (uses service role)
 */
export async function getSignedUploadUrl({ 
  propertyId, 
  tag, 
  fileName 
}: SignedUploadUrlParams): Promise<{ 
  path: string; 
  signedUrl: string; 
  token: string;
} | null> {
  try {
    console.log('getSignedUploadUrl called with:', { propertyId, tag, fileName });
    
    const db = await supabaseServer();
    
    // Sanitize filename
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Generate unique ID and path
    const id = ulid();
    const path = `${propertyId}/${tag}/${id}-${sanitized}`;
    
    console.log('Generated path:', path);
    
    // Generate signed upload URL
    const { data, error } = await db.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    console.log('Supabase storage response:', { data, error });

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return null;
    }

    return {
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    };
  } catch (error) {
    console.error('Exception in getSignedUploadUrl:', error);
    return null;
  }
}

/**
 * Generate a signed download URL for a file
 * Server-only function (uses service role)
 */
export async function getSignedDownloadUrl(
  storagePath: string
): Promise<string | null> {
  try {
    console.log('getSignedDownloadUrl called with path:', storagePath);
    
    // Check if path is valid
    if (!storagePath || typeof storagePath !== 'string') {
      console.error('Invalid storage path provided:', storagePath);
      return null;
    }
    
    const db = await supabaseServer();
    
    const { data, error } = await db.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, DOWNLOAD_EXPIRES_IN);

    console.log('Supabase signed URL response:', { data, error });

    if (error) {
      console.error('Error creating signed download URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Exception in getSignedDownloadUrl:', error);
    return null;
  }
}

/**
 * Upload file to storage using signed URL
 * Client-side function (uses signed URL, not service role)
 */
export async function uploadFileToSignedUrl(
  signedUrl: string,
  file: File
): Promise<boolean> {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-upsert': 'false', // Prevent overwriting
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error uploading file:', error);
    return false;
  }
}

/**
 * Delete file from storage
 * Server-only function (uses service role)
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  try {
    const db = await supabaseServer();
    
    const { error } = await db.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in deleteFile:', error);
    return false;
  }
}

