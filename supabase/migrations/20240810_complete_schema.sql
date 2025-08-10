-- ═══════════════════════════════════════════════════════════════
-- OPEN GROUND - Complete Database Schema Migration
-- Based on the comprehensive spec for Gumtree-style classifieds
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favourites CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS user_device_tokens CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- USERS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  avatar_url text,
  phone text,
  email text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- LISTINGS TABLE with PostGIS support
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(12,2),
  category text,
  lat double precision,
  lng double precision,
  geom geography(Point,4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat),4326)::geography
  ) STORED,
  images jsonb DEFAULT '[]',
  status text DEFAULT 'active', -- active|sold|expired
  promoted_type text DEFAULT 'none', -- none|spotlight|top
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz GENERATED ALWAYS AS (
    created_at + interval '30 days'
  ) STORED
);

-- ═══════════════════════════════════════════════════════════════
-- CHAT SYSTEM (threads, participants, messages)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  last_message text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE participants (
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY(thread_id, user_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  body text,
  image_urls jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  read_by jsonb DEFAULT '[]'
);

-- ═══════════════════════════════════════════════════════════════
-- FAVOURITES TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE favourites (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY(user_id, listing_id)
);

-- ═══════════════════════════════════════════════════════════════
-- REVIEWS SYSTEM
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_uid uuid REFERENCES users(id) ON DELETE CASCADE,
  to_uid uuid REFERENCES users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- REPORTS & MODERATION
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  target_type text, -- 'user' | 'listing' | 'message'
  target_id uuid,
  reason text,
  status text DEFAULT 'open', -- open|reviewing|resolved|dismissed
  admin_notes text,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════
-- PUSH NOTIFICATION TOKENS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE user_device_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  device_type text DEFAULT 'web', -- web|ios|android
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES for Performance
-- ═══════════════════════════════════════════════════════════════

-- Geographic index for location-based searches
CREATE INDEX listings_geom_gist ON listings USING gist(geom);

-- Full-text search index
CREATE INDEX listings_fts_gin ON listings USING gin (
  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))
);

-- Chat performance indexes
CREATE INDEX messages_thread_created_idx ON messages(thread_id, created_at DESC);
CREATE INDEX threads_updated_idx ON threads(updated_at DESC);

-- Common lookup indexes
CREATE INDEX listings_owner_created_idx ON listings(owner_id, created_at DESC);
CREATE INDEX listings_category_created_idx ON listings(category, created_at DESC);
CREATE INDEX reviews_to_uid_idx ON reviews(to_uid);
CREATE INDEX favourites_user_created_idx ON favourites(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- SEARCH FUNCTION with PostGIS support
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_search_listings(
  q text DEFAULT NULL,
  cat text DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  center_lat double precision DEFAULT NULL,
  center_lng double precision DEFAULT NULL,
  radius_km double precision DEFAULT 50
) RETURNS SETOF public.listings
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM public.listings
  WHERE status = 'active'
    AND expires_at > now()
    AND (q IS NULL OR (title ILIKE '%'||q||'%' OR description ILIKE '%'||q||'%'))
    AND (cat IS NULL OR category = cat)
    AND (min_price IS NULL OR price >= min_price)
    AND (max_price IS NULL OR price <= max_price)
    AND (center_lat IS NULL OR center_lng IS NULL
         OR ST_DWithin(
              geom,
              ST_SetSRID(ST_MakePoint(center_lng, center_lat),4326)::geography,
              radius_km * 1000
            ))
  ORDER BY 
    CASE WHEN promoted_type = 'top' THEN 1 
         WHEN promoted_type = 'spotlight' THEN 2 
         ELSE 3 END,
    created_at DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.rpc_search_listings TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- LISTINGS policies
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can manage their listings" ON listings FOR ALL USING (auth.uid() = owner_id);

-- THREADS & MESSAGES policies  
CREATE POLICY "Participants can access threads" ON threads FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM participants p 
    WHERE p.thread_id = id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Participants can access participants" ON participants FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM participants WHERE thread_id = participants.thread_id
  ));

CREATE POLICY "Thread members can access messages" ON messages FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM participants WHERE thread_id = messages.thread_id
  ));

-- FAVOURITES policies
CREATE POLICY "Users manage own favourites" ON favourites FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REVIEWS policies
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT 
  WITH CHECK (auth.uid() = from_uid);
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

-- REPORTS policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);
-- Admin access handled via service role

-- DEVICE TOKENS policies
CREATE POLICY "Users manage own tokens" ON user_device_tokens FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS for real-time updates
-- ═══════════════════════════════════════════════════════════════

-- Update thread.updated_at when new message is created
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads 
  SET updated_at = NOW(), last_message = NEW.body
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_thread 
  AFTER INSERT ON messages
  FOR EACH ROW 
  EXECUTE FUNCTION update_thread_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- INITIAL DATA (optional)
-- ═══════════════════════════════════════════════════════════════

-- Sample categories
-- INSERT INTO categories (name) VALUES 
--   ('Electronics'), ('Vehicles'), ('Property'), ('Jobs'), 
--   ('Home & Garden'), ('Fashion'), ('Sports'), ('Services');

COMMENT ON TABLE listings IS 'Core listings table with PostGIS support for location-based searches';
COMMENT ON FUNCTION rpc_search_listings IS 'Advanced search with full-text, price, category and geographic filtering';