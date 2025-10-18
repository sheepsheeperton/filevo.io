-- Clean up HTML content from existing request descriptions
-- This migration strips HTML tags and converts HTML entities to plain text

-- Function to strip HTML tags and convert entities
CREATE OR REPLACE FUNCTION strip_html_tags(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove HTML tags
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  
  -- Convert HTML entities
  input_text := replace(input_text, '&lt;', '<');
  input_text := replace(input_text, '&gt;', '>');
  input_text := replace(input_text, '&amp;', '&');
  input_text := replace(input_text, '&quot;', '"');
  input_text := replace(input_text, '&#39;', '''');
  input_text := replace(input_text, '&nbsp;', ' ');
  
  -- Clean up extra whitespace
  input_text := regexp_replace(input_text, '\s+', ' ', 'g');
  input_text := trim(input_text);
  
  RETURN input_text;
END;
$$ LANGUAGE plpgsql;

-- Update existing requests that have HTML content in descriptions
UPDATE requests 
SET description = strip_html_tags(description)
WHERE description IS NOT NULL 
  AND (description LIKE '%<div%' OR description LIKE '%<h2%' OR description LIKE '%<p%' OR description LIKE '%<ul%' OR description LIKE '%<li%');

-- Drop the temporary function
DROP FUNCTION strip_html_tags(TEXT);
