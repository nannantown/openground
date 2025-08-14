-- Review System Migration
-- Create comprehensive review system for marketplace transactions

-- ==============================================
-- 1. Reviews table
-- ==============================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Review relationship
  reviewer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  
  -- Review content
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  
  -- Transaction context
  transaction_type text NOT NULL CHECK (transaction_type IN ('buyer_to_seller', 'seller_to_buyer')),
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(reviewer_id, reviewee_id, listing_id, transaction_type)
);

-- Add indexes for performance
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);

-- ==============================================
-- 2. User stats table (for caching review statistics)
-- ==============================================
CREATE TABLE public.user_review_stats (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Rating statistics
  average_rating numeric(3,2) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  
  -- Rating breakdown
  rating_5_count integer DEFAULT 0,
  rating_4_count integer DEFAULT 0,
  rating_3_count integer DEFAULT 0,
  rating_2_count integer DEFAULT 0,
  rating_1_count integer DEFAULT 0,
  
  -- Timestamps
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ==============================================
-- 3. Functions for review statistics
-- ==============================================

-- Function to update user review statistics
CREATE OR REPLACE FUNCTION update_user_review_stats(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_review_stats (user_id, average_rating, total_reviews, rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count, updated_at)
  SELECT 
    target_user_id,
    COALESCE(ROUND(AVG(rating::numeric), 2), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    now()
  FROM public.reviews 
  WHERE reviewee_id = target_user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to check if user can review (has completed transaction)
CREATE OR REPLACE FUNCTION can_user_review(
  p_reviewer_id uuid,
  p_reviewee_id uuid,
  p_listing_id uuid,
  p_transaction_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  listing_owner_id uuid;
  has_messaged boolean := false;
BEGIN
  -- Get listing owner
  SELECT owner_id INTO listing_owner_id
  FROM public.listings
  WHERE id = p_listing_id;
  
  -- Check if reviewer has messaged about this listing
  SELECT EXISTS(
    SELECT 1 FROM public.messages m
    JOIN public.threads t ON m.thread_id = t.id
    WHERE t.listing_id = p_listing_id
    AND (
      (p_transaction_type = 'buyer_to_seller' AND m.sender_id = p_reviewer_id AND listing_owner_id = p_reviewee_id) OR
      (p_transaction_type = 'seller_to_buyer' AND m.sender_id = p_reviewer_id AND p_reviewer_id = listing_owner_id)
    )
  ) INTO has_messaged;
  
  RETURN has_messaged;
END;
$$;

-- ==============================================
-- 4. Triggers for automatic stats updates
-- ==============================================

-- Trigger function to update stats when review is added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update stats for the reviewee
  IF TG_OP = 'DELETE' THEN
    PERFORM update_user_review_stats(OLD.reviewee_id);
    RETURN OLD;
  ELSE
    PERFORM update_user_review_stats(NEW.reviewee_id);
    -- If reviewee changed, update old reviewee too
    IF TG_OP = 'UPDATE' AND OLD.reviewee_id != NEW.reviewee_id THEN
      PERFORM update_user_review_stats(OLD.reviewee_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_reviews_stats_update
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_review_stats();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ==============================================
-- 5. RLS Policies
-- ==============================================

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_review_stats ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create reviews for their transactions"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    can_user_review(reviewer_id, reviewee_id, listing_id, transaction_type)
  );

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- User review stats policies
CREATE POLICY "Anyone can view review stats"
  ON public.user_review_stats FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only triggers can modify stats
CREATE POLICY "Only system can modify review stats"
  ON public.user_review_stats FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ==============================================
-- 6. Grants
-- ==============================================

-- Grant permissions
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.user_review_stats TO anon, authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION update_user_review_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_review(uuid, uuid, uuid, text) TO authenticated;

-- ==============================================
-- 7. Comments for documentation
-- ==============================================

COMMENT ON TABLE public.reviews IS 'User reviews for completed transactions';
COMMENT ON TABLE public.user_review_stats IS 'Cached review statistics for users (automatically updated)';
COMMENT ON FUNCTION update_user_review_stats(uuid) IS 'Updates cached review statistics for a user';
COMMENT ON FUNCTION can_user_review(uuid, uuid, uuid, text) IS 'Checks if user can review based on transaction history';

-- Initialize stats for existing users
INSERT INTO public.user_review_stats (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;