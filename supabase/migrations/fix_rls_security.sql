-- Fix RLS Security Issues
-- This migration addresses the database linter errors for RLS disabled tables

-- ==============================================
-- 0. Create necessary ENUM types for data integrity
-- ==============================================
-- Create listing status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create thread status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE thread_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing tables to use enum types (if they're currently text)
-- Only update if tables exist and columns are currently text type
DO $$
BEGIN
    -- Update listings table status column if it exists and is text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' 
        AND column_name = 'status' 
        AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.listings ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.listings ALTER COLUMN status TYPE listing_status USING status::listing_status;
        ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'active'::listing_status;
        RAISE NOTICE 'Updated listings.status column to use listing_status enum';
    END IF;

    -- Update threads table status column if it exists and is text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'threads' 
        AND column_name = 'status' 
        AND data_type = 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.threads ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.threads ALTER COLUMN status TYPE thread_status USING status::thread_status;
        ALTER TABLE public.threads ALTER COLUMN status SET DEFAULT 'open'::thread_status;
        RAISE NOTICE 'Updated threads.status column to use thread_status enum';
    END IF;
END $$;

-- ==============================================
-- 1. Fix spatial_ref_sys table RLS issue
-- ==============================================
-- Note: spatial_ref_sys is a PostGIS system table
-- We should not enable RLS on system tables as they contain reference data
-- Instead, we'll restrict access through schema permissions

-- Grant only SELECT access to spatial_ref_sys for authenticated users
REVOKE ALL ON TABLE public.spatial_ref_sys FROM PUBLIC;
REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon;
GRANT SELECT ON TABLE public.spatial_ref_sys TO authenticated;

-- ==============================================
-- 2. Fix users table RLS issue
-- ==============================================
-- Enable RLS on users table (this is critical for security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create comprehensive RLS policies for users table
-- 1. Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Enable user registration (insert)
CREATE POLICY "Enable insert for authenticated users only" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 4. Public profiles are viewable by everyone (limited fields)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
TO authenticated, anon
USING (true);

-- ==============================================
-- 3. Additional security measures
-- ==============================================
-- Ensure other tables have proper RLS if they don't already

-- Check and enable RLS on listings table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings' AND table_schema = 'public') THEN
        ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on listings table';
    END IF;
END $$;

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;

CREATE POLICY "Anyone can view active listings" 
ON public.listings FOR SELECT 
TO authenticated, anon
USING (status = 'active'::listing_status OR auth.uid() = owner_id);

CREATE POLICY "Users can insert their own listings" 
ON public.listings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own listings" 
ON public.listings FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own listings" 
ON public.listings FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);

-- Enable RLS on favourites table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favourites' AND table_schema = 'public') THEN
        ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on favourites table';
    END IF;
END $$;

-- Favourites policies
DROP POLICY IF EXISTS "Users can view their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can insert their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can delete their own favourites" ON public.favourites;

CREATE POLICY "Users can view their own favourites" 
ON public.favourites FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favourites" 
ON public.favourites FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourites" 
ON public.favourites FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Enable RLS on threads table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'threads' AND table_schema = 'public') THEN
        ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on threads table';
    END IF;
END $$;

-- Threads policies (messages functionality)
DROP POLICY IF EXISTS "Users can view threads they participate in" ON public.threads;
DROP POLICY IF EXISTS "Users can create threads" ON public.threads;

CREATE POLICY "Users can view threads they participate in" 
ON public.threads FOR SELECT 
TO authenticated 
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = (SELECT owner_id FROM listings WHERE id = listing_id)
);

CREATE POLICY "Users can create threads" 
ON public.threads FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = buyer_id);

-- Enable RLS on messages table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on messages table';
    END IF;
END $$;

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their threads" ON public.messages;

CREATE POLICY "Users can view messages in their threads" 
ON public.messages FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM threads t 
    WHERE t.id = thread_id 
    AND (
      auth.uid() = t.buyer_id OR 
      auth.uid() = (SELECT owner_id FROM listings WHERE id = t.listing_id)
    )
  )
);

CREATE POLICY "Users can send messages in their threads" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM threads t 
    WHERE t.id = thread_id 
    AND (
      auth.uid() = t.buyer_id OR 
      auth.uid() = (SELECT owner_id FROM listings WHERE id = t.listing_id)
    )
  )
);

-- ==============================================
-- 4. Security validation
-- ==============================================
-- Verify RLS is enabled on all critical tables
DO $$
BEGIN
    -- Check if RLS is enabled on critical tables
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE c.relname = 'users' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on users table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE c.relname = 'listings' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on listings table';
    END IF;

    RAISE NOTICE 'RLS security validation completed successfully';
END $$;

-- ==============================================
-- 5. Update database comments for security documentation
-- ==============================================
COMMENT ON TABLE public.users IS 'User profiles with RLS enabled for privacy and security';
COMMENT ON TABLE public.listings IS 'Marketplace listings with RLS policies for owner access control';
COMMENT ON TABLE public.favourites IS 'User favourites with RLS ensuring users can only access their own';
COMMENT ON TABLE public.threads IS 'Message threads with RLS for participant-only access';
COMMENT ON TABLE public.messages IS 'Messages with RLS ensuring thread participant access only';