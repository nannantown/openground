-- Fix Function Search Path Security Warnings
-- Set secure search_path for all custom functions

-- Fix set_listing_expires_at function
ALTER FUNCTION public.set_listing_expires_at() SET search_path = '';

-- Fix update_listing_geom function  
ALTER FUNCTION public.update_listing_geom() SET search_path = '';

-- Fix rpc_search_listings function
ALTER FUNCTION public.rpc_search_listings(text, text, numeric, text) SET search_path = '';

-- Note: Empty search_path ('') is the most secure setting
-- It prevents potential SQL injection through search path manipulation