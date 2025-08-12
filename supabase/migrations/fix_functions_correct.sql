-- Fix Function Search Path Security - Correct version
-- Find and fix all custom functions with proper signatures

-- Fix rpc_search_listings function (with correct parameters)
ALTER FUNCTION public.rpc_search_listings(
  text, -- q
  text, -- cat  
  numeric, -- min_price
  numeric, -- max_price
  double precision, -- center_lat
  double precision, -- center_lng
  double precision  -- radius_km
) SET search_path = '';

-- Alternative: Try without specifying all parameters (PostgreSQL will match)
-- If above fails, try these individual approaches:

-- Option 1: Set search_path for all functions with this name
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and fix rpc_search_listings function
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'rpc_search_listings' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', func_record.proname, func_record.args);
        RAISE NOTICE 'Fixed function: public.%(%)', func_record.proname, func_record.args;
    END LOOP;

    -- Find and fix set_listing_expires_at function
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'set_listing_expires_at'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', func_record.proname, func_record.args);
        RAISE NOTICE 'Fixed function: public.%(%)', func_record.proname, func_record.args;
    END LOOP;

    -- Find and fix update_listing_geom function
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'update_listing_geom'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', func_record.proname, func_record.args);
        RAISE NOTICE 'Fixed function: public.%(%)', func_record.proname, func_record.args;
    END LOOP;

    RAISE NOTICE 'Function search path security fixes completed!';
END $$;