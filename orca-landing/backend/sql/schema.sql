-- =============================================================================
-- ORCA Master Database Schema & Row Level Security (RLS) Setup
-- Project: ORCA — Marine EcOsystem Reasoning with Collaborative Agents
-- Stack: Supabase (PostgreSQL 15+ with PostGIS)
-- =============================================================================

-- 1. Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'bn', 'mr', 'ta')),
    location GEOGRAPHY(POINT, 4326),  -- PostGIS point for user's fishing base port
    location_name TEXT,               -- Human-readable port name
    vessel_type TEXT CHECK (vessel_type IN ('small', 'medium', 'large')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversations (chat sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,                        -- Auto-generated from first message
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages within conversations
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',       -- Agent evidence, source citations, map layer features
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alerts (proactive hazard warnings)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('red', 'amber', 'info')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_area GEOGRAPHY(POLYGON, 4326),  -- PostGIS polygon for affected marine zone
    source TEXT NOT NULL,              -- e.g. 'INCOIS', 'IMD'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Geofence Zones (Marine Protected Areas & International Boundaries)
CREATE TABLE IF NOT EXISTS public.geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('MPA', 'IMBL', 'RESTRICTED')),
    boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- =============================================================================

-- Enable Row Level Security on all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles Table Policies (Users have complete ownership of their own profile)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Conversations Table Policies (Users manage their own chat threads)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Messages Table Policies (Users read and append messages to their own threads)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Public Read Policies (Alerts and Geofence Zones are accessible to all users)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.alerts;
CREATE POLICY "Anyone can view alerts" ON public.alerts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view geofence zones" ON public.geofence_zones;
CREATE POLICY "Anyone can view geofence zones" ON public.geofence_zones
    FOR SELECT USING (true);

-- =============================================================================
-- POSTGIS GEOFENCING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_point_geofence(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION)
RETURNS TABLE (
    id UUID,
    name TEXT,
    zone_type TEXT,
    description TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
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

GRANT EXECUTE ON FUNCTION public.check_point_geofence(DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated, service_role;

-- Revoke execute on internal trigger function from public roles
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
    END IF;
END $$;

-- =============================================================================
-- PERFORMANCE & GEOSPATIAL INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_area ON public.alerts USING GIST(affected_area);
CREATE INDEX IF NOT EXISTS idx_geofence_boundary ON public.geofence_zones USING GIST(boundary);
