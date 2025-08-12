-- Simple Function Security Fix
-- This will automatically find and fix all custom functions

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Fix all public functions that don't have search_path set
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('rpc_search_listings', 'set_listing_expires_at', 'update_listing_geom')
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Fixed function: public.%(%)', func_record.proname, func_record.args;
    END LOOP;

    RAISE NOTICE '✅ All function security fixes completed!';
END $$;