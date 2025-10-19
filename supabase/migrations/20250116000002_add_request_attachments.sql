-- Add request attachments support to files table
-- This allows files to be linked directly to requests (for manager attachments)
-- or to request_items (for recipient uploads)

-- Add request_id column to files table
ALTER TABLE files 
ADD COLUMN request_id UUID REFERENCES requests(id) ON DELETE CASCADE;

-- Make request_item_id nullable (it was already nullable, but let's be explicit)
ALTER TABLE files 
ALTER COLUMN request_item_id DROP NOT NULL;

-- Add origin column to track file source
ALTER TABLE files 
ADD COLUMN origin TEXT CHECK (origin IN ('request_attachment','item_upload')) DEFAULT 'item_upload';

-- Add tag column for better organization
ALTER TABLE files 
ADD COLUMN tag TEXT DEFAULT 'document';

-- Add file size and content type for better metadata
ALTER TABLE files 
ADD COLUMN file_size BIGINT;
ALTER TABLE files 
ADD COLUMN content_type TEXT;

-- Update existing files to have item_upload origin
UPDATE files 
SET origin = 'item_upload' 
WHERE origin IS NULL;

-- Add index for request_id lookups
CREATE INDEX IF NOT EXISTS idx_files_request_id ON files(request_id);

-- Add index for request_item_id lookups (existing files)
CREATE INDEX IF NOT EXISTS idx_files_request_item_id ON files(request_item_id);

-- Update RLS policies to handle request attachments
-- Allow managers to read files for their properties
CREATE POLICY "Managers can read files for their properties" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN properties p ON r.property_id = p.id
    JOIN property_users pu ON p.id = pu.property_id
    WHERE (files.request_id = r.id OR files.request_item_id IN (
      SELECT id FROM request_items WHERE request_id = r.id
    ))
    AND pu.user_id = auth.uid()
  )
);

-- Allow managers to insert files for their properties
CREATE POLICY "Managers can insert files for their properties" ON files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN properties p ON r.property_id = p.id
    JOIN property_users pu ON p.id = pu.property_id
    WHERE (files.request_id = r.id OR files.request_item_id IN (
      SELECT id FROM request_items WHERE request_id = r.id
    ))
    AND pu.user_id = auth.uid()
  )
);

-- Allow managers to delete files for their properties
CREATE POLICY "Managers can delete files for their properties" ON files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN properties p ON r.property_id = p.id
    JOIN property_users pu ON p.id = pu.property_id
    WHERE (files.request_id = r.id OR files.request_item_id IN (
      SELECT id FROM request_items WHERE request_id = r.id
    ))
    AND pu.user_id = auth.uid()
  )
);

-- Add comment
COMMENT ON COLUMN files.request_id IS 'Direct link to request (for manager attachments)';
COMMENT ON COLUMN files.request_item_id IS 'Link to request item (for recipient uploads)';
COMMENT ON COLUMN files.origin IS 'Source of file: request_attachment or item_upload';
COMMENT ON COLUMN files.tag IS 'File tag for organization';
COMMENT ON COLUMN files.file_size IS 'File size in bytes';
COMMENT ON COLUMN files.content_type IS 'MIME type of the file';
