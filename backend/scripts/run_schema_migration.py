import os
import httpx
import json

SUPABASE_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "tpsbavjmnqevlvrermnf")

migration_sql = """
-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. User profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'bn', 'mr', 'ta')),
    location GEOGRAPHY(POINT, 4326),
    location_name TEXT,
    vessel_type TEXT CHECK (vessel_type IN ('small', 'medium', 'large')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('red', 'amber', 'info')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_area GEOGRAPHY(POLYGON, 4326),
    source TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Geofence Zones
CREATE TABLE IF NOT EXISTS public.geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('MPA', 'IMBL', 'RESTRICTED')),
    boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY ON ALL APPLICATION TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;

-- 8. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 9. CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- 10. MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

-- 11. ALERTS & GEOFENCE ZONES POLICIES (Public Read Access)
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.alerts;
CREATE POLICY "Anyone can view alerts" ON public.alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view geofence zones" ON public.geofence_zones;
CREATE POLICY "Anyone can view geofence zones" ON public.geofence_zones FOR SELECT USING (true);

-- 12. PostGIS spatial_ref_sys Security Hardening (Revoke write, allow select)
REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
GRANT SELECT ON public.spatial_ref_sys TO anon, authenticated;

-- 13. POSTGIS RPC FUNCTION
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

GRANT EXECUTE ON FUNCTION public.check_point_geofence(DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated, service_role;

-- 14. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_area ON public.alerts USING GIST(affected_area);
CREATE INDEX IF NOT EXISTS idx_geofence_boundary ON public.geofence_zones USING GIST(boundary);
"""

def apply_migration():
    print("Applying complete schema migration and RLS fixes to Supabase...")
    headers = {
        "Authorization": f"Bearer {SUPABASE_TOKEN}",
        "Content-Type": "application/json"
    }
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    resp = httpx.post(url, headers=headers, json={"query": migration_sql}, timeout=60.0)
    print("HTTP Status:", resp.status_code)
    try:
        print("Response:", json.dumps(resp.json(), indent=2))
    except Exception:
        print("Response:", resp.text)

if __name__ == "__main__":
    apply_migration()
