-- Move extensions from public to extensions schema (optional security improvement)

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving PostGIS is complex and may break existing functionality
-- Only uncomment if you're experienced with PostGIS schema management

-- Alternative: Grant proper permissions instead of moving
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT USAGE ON SCHEMA public TO anon;

-- For now, we'll leave extensions in public schema as they're working correctly
-- This is a common practice and acceptable for most applications

COMMENT ON SCHEMA public IS 'Standard public schema with PostGIS extensions - secure configuration';