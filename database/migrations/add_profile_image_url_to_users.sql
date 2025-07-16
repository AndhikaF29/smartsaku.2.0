-- Migration: Add profile_image_url column to users table
-- File: add_profile_image_url_to_users.sql
-- Description: Adds profile image URL column to store user profile images from Supabase Storage

-- Add profile_image_url column to users table
ALTER TABLE public.users 
ADD COLUMN profile_image_url TEXT NULL;

-- Add comment to the column
COMMENT ON COLUMN public.users.profile_image_url IS 'URL of the user profile image stored in Supabase Storage';

-- Create index for faster queries (optional, if you plan to query by image URL)
-- CREATE INDEX idx_users_profile_image_url ON public.users(profile_image_url);

-- Update the updated_at timestamp for existing records (optional)
-- UPDATE public.users SET updated_at = NOW() WHERE profile_image_url IS NULL;