-- COMPLETE STORAGE FIX - Run these SQL commands in Supabase SQL Editor

-- Step 1: Disable RLS temporarily to test if it works
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'profile';

-- Step 3: If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile', 'profile', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/*'];

-- Step 4: After testing upload works, re-enable RLS with simple policies
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 5: Apply simple policies (run after re-enabling RLS)
-- DROP POLICY IF EXISTS "Anyone can upload to profile bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can delete from profile bucket" ON storage.objects;

-- CREATE POLICY "Anyone can upload to profile bucket" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'profile');

-- CREATE POLICY "Anyone can view profile images" ON storage.objects  
-- FOR SELECT USING (bucket_id = 'profile');

-- CREATE POLICY "Anyone can delete from profile bucket" ON storage.objects
-- FOR DELETE USING (bucket_id = 'profile');

-- Step 6: Verify bucket configuration
SELECT * FROM storage.buckets WHERE id = 'profile';