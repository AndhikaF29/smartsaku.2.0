-- Storage Policies for Profile Images - CORRECTED VERSION
-- File: profile_storage_policies.sql
-- Description: Creates simplified storage policies for the 'profile' bucket

-- First, make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies for the profile bucket to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload) files to profile bucket
CREATE POLICY "Enable upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow users to SELECT (view/download) files from profile bucket
CREATE POLICY "Enable read access for authenticated users" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to UPDATE files in profile bucket
CREATE POLICY "Enable update for authenticated users" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow users to DELETE files from profile bucket
CREATE POLICY "Enable delete for authenticated users" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
);

-- Alternative: More restrictive policies (uncomment if you want user-specific access)
-- These policies ensure users can only access their own files by checking filename contains their user ID

/*
-- Policy 1: Users can only upload files with their user ID in the filename
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = split_part(name, '-', 1)
);

-- Policy 2: Users can only view files with their user ID in the filename
CREATE POLICY "Users can view their own profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = split_part(name, '-', 1)
);

-- Policy 3: Users can only update files with their user ID in the filename
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = split_part(name, '-', 1)
);

-- Policy 4: Users can only delete files with their user ID in the filename
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = split_part(name, '-', 1)
);
*/

-- Verify the bucket exists (run this to check)
-- SELECT * FROM storage.buckets WHERE id = 'profile';

-- Note: Make sure the 'profile' bucket is created in Supabase Dashboard with:
-- - Bucket Name: profile
-- - Public: true (for easy access to images)
-- - Allowed MIME types: image/* (optional)
-- - File size limit: 5MB (optional)