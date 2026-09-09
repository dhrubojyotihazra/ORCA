-- 1. Enable RLS on spatial_ref_sys to satisfy Supabase security advisor
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spatial_ref_sys' AND policyname = 'Allow public read access to spatial_ref_sys') THEN
        CREATE POLICY "Allow public read access to spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Create PostGIS RPC function for fast geofence point checking
CREATE OR REPLACE FUNCTION public.check_point_geofence(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION)
RETURNS TABLE (
    id UUID,
    name TEXT,
    zone_type TEXT,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gz.id,
        gz.name,
        gz.zone_type,
        gz.description
    FROM public.geofence_zones gz
    WHERE ST_Contains(
        gz.boundary::geometry, 
        ST_SetSRID(ST_Point(p_lon, p_lat), 4326)
    );
END;
$$;

-- Grant execution permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_point_geofence(DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated, service_role;
