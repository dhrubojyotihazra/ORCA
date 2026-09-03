# Isheeka -- Backend & API Integration Checklist

**Role:** Backend & Persistence Lead
**Owner:** Isheeka
**Stack:** FastAPI · Supabase (PostgreSQL + Auth + PostGIS) · Groq API · LangGraph integration
**Repo:** `https://github.com/dhrubojyotihazra/ORCA`
**Working Directory:** `orca-landing/backend/` (create this directory)
**Last Updated:** 3 September 2026

---

## How to Read This Document

This is your master task list. Each section is a self-contained deliverable. Tasks are ordered by dependency -- **do them top to bottom**. Each task has:

- **What:** The deliverable
- **Why:** Why this matters and who is blocked without it
- **Acceptance:** How you (or your Antigravity agent) know it's done
- **Files to create/modify:** Exact file paths

> **IMPORTANT:** Biswanath (Frontend) and Samprikta (Agents) are both blocked until you deliver Phase 1 and Phase 2. Prioritise those above everything else.

---

## Phase 0 -- Project Scaffolding (Day 1)

> This phase sets up the backend project structure. Nothing works without this.

### Task 0.1: Create the backend directory structure

**What:** Create the FastAPI project skeleton inside the monorepo.

**Files to create:**
```
orca-landing/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Environment variables / settings
│   ├── dependencies.py          # Shared dependencies (Supabase client, etc.)
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py              # Auth endpoints (login, signup, verify OTP)
│   │   ├── chat.py              # Chat endpoints (send message, get history)
│   │   ├── alerts.py            # Alerts endpoints (get alerts for user location)
│   │   └── user.py              # User profile endpoints (get/update profile)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User Pydantic models
│   │   ├── chat.py              # Chat/Message Pydantic models
│   │   └── alert.py             # Alert Pydantic models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_client.py   # Supabase client singleton
│   │   ├── auth_service.py      # Auth logic (wraps Supabase Auth)
│   │   ├── chat_service.py      # Chat/conversation CRUD
│   │   ├── agent_service.py     # Bridge to LangGraph agents
│   │   └── groq_service.py      # Groq Whisper + LLM API wrapper
│   │
│   └── utils/
│       ├── __init__.py
│       └── geo.py               # Geospatial helpers (lat/lon validation, PostGIS queries)
│
├── requirements.txt             # Python dependencies
├── .env.example                 # Template for environment variables
├── Dockerfile                   # Container build (stretch goal)
└── README.md                    # Backend-specific setup instructions
```

**Acceptance:**
- [ ] `cd orca-landing/backend && pip install -r requirements.txt` runs without error
- [ ] `uvicorn app.main:app --reload` starts and returns `{"status": "ok"}` on `GET /`
- [ ] Directory structure matches the tree above

---

### Task 0.2: Create `requirements.txt`

**What:** Pin all backend dependencies.

**Contents:**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
supabase==2.15.0
python-dotenv==1.0.1
pydantic==2.11.0
httpx==0.28.0
groq==0.25.0
langchain-groq==0.3.0
langgraph==0.4.0
python-multipart==0.0.18
sse-starlette==2.2.1
```

**Acceptance:**
- [ ] `pip install -r requirements.txt` completes without conflicts

---

### Task 0.3: Create `.env.example`

**What:** Document every environment variable the backend needs. This is also documentation for the team.

**Contents:**
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq
GROQ_API_KEY=your-groq-api-key

# App
APP_ENV=development
CORS_ORIGINS=http://localhost:3000
```

**Acceptance:**
- [ ] File exists at `backend/.env.example`
- [ ] A real `.env` file (gitignored) exists locally with working credentials
- [ ] `config.py` loads these via `python-dotenv`

---

### Task 0.4: Create `app/main.py` -- FastAPI entry point

**What:** Minimal FastAPI app with CORS, health check, and router registration.

**Key requirements:**
- Enable CORS for `http://localhost:3000` (Biswanath's Next.js dev server)
- Mount all routers under `/api/v1/`
- Add a `GET /` health check that returns `{"status": "ok", "version": "0.1.0"}`

**Acceptance:**
- [ ] `curl http://localhost:8000/` returns `{"status":"ok","version":"0.1.0"}`
- [ ] `curl http://localhost:8000/api/v1/chat/` returns a valid response (even if empty)
- [ ] CORS headers are present in response (check with browser DevTools)

---

## Phase 1 -- Supabase Setup & Auth (Days 2-3)

> Biswanath's `/login` and `/onboarding` pages are blocked on this. Top priority.

### Task 1.1: Create the Supabase project

**What:** Set up a new Supabase project on supabase.com for the team.

**Steps:**
1. Create a new project at https://supabase.com/dashboard
2. Name it `orca-sih2026`
3. Choose region: `ap-south-1` (Mumbai) for lowest latency to India
4. Save the project URL and keys to your `.env`
5. Enable Phone Auth (OTP) in Supabase Dashboard → Authentication → Providers
6. Enable Google OAuth in Supabase Dashboard → Authentication → Providers
7. Enable Email/Password auth (it's on by default)

**Why:** Every other backend service depends on the Supabase client. Biswanath needs the Supabase URL and anon key to wire up the frontend auth.

**Acceptance:**
- [ ] Supabase project is live and accessible
- [ ] Phone OTP, Email/Password, and Google OAuth are all enabled
- [ ] `.env` has real `SUPABASE_URL` and keys
- [ ] Share the `SUPABASE_URL` and `SUPABASE_ANON_KEY` with Biswanath (he needs it for frontend auth)

---

### Task 1.2: Create the database schema (SQL migrations)

**What:** Create the tables that store users, conversations, messages, and alerts.

**SQL to run in Supabase SQL Editor:**

```sql
-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'bn', 'mr', 'ta')),
    location GEOGRAPHY(POINT, 4326),  -- PostGIS point for user's fishing base
    location_name TEXT,               -- Human-readable location name
    vessel_type TEXT CHECK (vessel_type IN ('small', 'medium', 'large')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (chat sessions)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,                        -- Auto-generated from first message
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within conversations
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',       -- Agent evidence, source citations, map data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (proactive hazard warnings)
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL CHECK (severity IN ('red', 'amber', 'info')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_area GEOGRAPHY(POLYGON, 4326),  -- PostGIS polygon for affected zone
    source TEXT NOT NULL,              -- e.g. 'INCOIS', 'IMD'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access messages in their own conversations
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- Alerts are public read
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view alerts" ON public.alerts
    FOR SELECT USING (true);

-- Index for fast message lookups
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_conversations_user ON public.conversations(user_id, updated_at DESC);
-- Spatial index for alerts
CREATE INDEX idx_alerts_area ON public.alerts USING GIST(affected_area);
```

**Why:** This is the data layer everything else writes to. Without tables, there's no persistence.

**Acceptance:**
- [ ] All 4 tables exist in Supabase with correct columns
- [ ] PostGIS extension is enabled
- [ ] RLS policies are active
- [ ] You can insert and query a test profile via the Supabase Dashboard

---

### Task 1.3: Build the Auth endpoints

**What:** Create `routers/auth.py` with endpoints that wrap Supabase Auth.

**Endpoints to implement:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Create account (email + password) |
| `POST` | `/api/v1/auth/login` | Login (email + password) |
| `POST` | `/api/v1/auth/otp/send` | Send OTP to phone number |
| `POST` | `/api/v1/auth/otp/verify` | Verify phone OTP |
| `POST` | `/api/v1/auth/google` | Google OAuth redirect URL |
| `GET`  | `/api/v1/auth/me` | Get current user from JWT |
| `POST` | `/api/v1/auth/logout` | Invalidate session |

**Why:** Biswanath's `/login` page needs these endpoints. Without them, the entire app is stuck behind a non-functional login screen.

**Acceptance:**
- [ ] Can sign up with email/password and receive a JWT
- [ ] Can send an OTP to a phone number and verify it
- [ ] `GET /auth/me` with a valid JWT returns the user profile
- [ ] Invalid/expired JWTs return `401 Unauthorized`

---

### Task 1.4: Build the User Profile endpoints

**What:** Create `routers/user.py` for profile CRUD.

**Endpoints to implement:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/user/profile` | Get current user's profile |
| `PUT` | `/api/v1/user/profile` | Update profile (name, language, location, vessel) |
| `POST` | `/api/v1/user/onboarding` | Create profile from onboarding flow (all 4 fields at once) |

**Why:** Biswanath's `/onboarding` page sends the 4-step data (name, language, location, vessel) here.

**Acceptance:**
- [ ] `POST /user/onboarding` with `{name, language, lat, lon, vessel_type}` creates a profile
- [ ] `GET /user/profile` returns the saved profile
- [ ] Location is stored as a PostGIS POINT

---

## Phase 2 -- Chat & Agent Bridge (Days 4-6)

> This is the core of the app. Samprikta's LangGraph agents need this to receive queries. Biswanath's `/chat` page needs this to send and display messages.

### Task 2.1: Build the Chat CRUD endpoints

**What:** Create `routers/chat.py` for conversation and message management.

**Endpoints to implement:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/chat/conversations` | Create a new conversation |
| `GET` | `/api/v1/chat/conversations` | List user's conversations (recent first) |
| `GET` | `/api/v1/chat/conversations/{id}` | Get a single conversation with all messages |
| `DELETE` | `/api/v1/chat/conversations/{id}` | Delete a conversation |
| `POST` | `/api/v1/chat/conversations/{id}/messages` | Send a message & get AI response |

**Why:** This is the main data flow. Every user interaction goes through this.

**Acceptance:**
- [ ] Can create a conversation, send a message, and receive a stored response
- [ ] `GET /conversations` returns conversations sorted by `updated_at DESC`
- [ ] Deleting a conversation cascades to its messages

---

### Task 2.2: Build the Agent Service bridge

**What:** Create `services/agent_service.py` -- the bridge between the FastAPI chat endpoint and Samprikta's LangGraph graph.

**How it works:**
1. Chat endpoint receives a user message
2. `agent_service.py` constructs the `AgentState` dict (query, language, location)
3. Invokes Samprikta's LangGraph graph (imported from `agents/graph.py`)
4. Extracts `final_answer` and `evidence` from the returned state
5. Returns the answer to the chat endpoint to be saved as an assistant message

**IMPORTANT:** Until Samprikta has the LangGraph graph ready, create a **mock agent** that returns a hardcoded response like:
```json
{
  "final_answer": "This is a placeholder response. The agent pipeline is being integrated.",
  "evidence": ["Mock source: ISRO MOSDAC"]
}
```
This unblocks Biswanath immediately -- the frontend can send/receive messages even with a mock backend.

**Acceptance:**
- [ ] `POST /chat/conversations/{id}/messages` with `{"content": "Is it safe to fish?"}` returns a response
- [ ] The mock agent response is stored in the `messages` table with `role: assistant`
- [ ] When Samprikta's graph is ready, swapping the mock for the real graph requires changing only one import

---

### Task 2.3: Implement SSE streaming for responses

**What:** Instead of waiting for the full agent response, stream it token-by-token using Server-Sent Events (SSE).

**Why:** The frontend shows a "thinking" animation and then streams text word-by-word, matching the ChatGPT/Claude experience. Without SSE, users stare at a blank screen for 3-5 seconds.

**Implementation:**
- Use `sse-starlette` package
- The `/messages` endpoint should accept an `Accept: text/event-stream` header
- Each SSE event sends a chunk of the response
- Final event sends `[DONE]` with the full message metadata

**Acceptance:**
- [ ] `curl` with `Accept: text/event-stream` receives chunked responses
- [ ] The full assembled response is still saved to the database
- [ ] Non-streaming fallback (regular JSON response) still works if SSE header is not sent

---

## Phase 3 -- Groq Integration (Days 5-6)

### Task 3.1: Build the Groq Whisper (Speech-to-Text) endpoint

**What:** Create an endpoint that accepts an audio file (from the mic button) and returns transcribed text.

**Endpoint:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/voice/transcribe` | Upload audio → return text transcription |

**Implementation:**
- Accept `multipart/form-data` with an audio file
- Send it to Groq's Whisper API (`groq.audio.transcriptions.create`)
- Model: `whisper-large-v3`
- Return: `{"text": "transcribed text", "language": "detected_language"}`

**Why:** This is the primary ASR (speech-to-text) pipeline. The mic button on Biswanath's InputBar sends audio here.

**Acceptance:**
- [ ] Upload a `.webm` or `.wav` audio file → get back a text transcription
- [ ] Language detection works for English, Hindi, Bengali, Marathi, Tamil
- [ ] Response time is under 2 seconds for a 10-second clip

---

### Task 3.2: Build the Groq LLM wrapper

**What:** Create `services/groq_service.py` with a reusable function to call Groq's Llama 3 70B.

**Why:** Samprikta's agents and the Synthesizer will all call this service. Centralising it means one place to manage API keys, rate limits, and model selection.

**Interface:**
```python
async def groq_chat(
    messages: list[dict],       # [{"role": "system", "content": "..."}, ...]
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.3,
    max_tokens: int = 2048,
    stream: bool = False
) -> str | AsyncGenerator:
    ...
```

**Acceptance:**
- [ ] `groq_chat([{"role": "user", "content": "Hello"}])` returns a string response
- [ ] Streaming mode returns an async generator of token chunks
- [ ] API key errors raise a clear `503 Service Unavailable` with a useful error message

---

## Phase 4 -- Alerts & Geofencing (Days 7-8)

### Task 4.1: Build the Alerts endpoints

**What:** Create `routers/alerts.py` to serve hazard alerts filtered by user location.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/alerts` | Get active alerts near the user's saved location |
| `GET` | `/api/v1/alerts/{id}` | Get a single alert's full details |

**How location filtering works:**
- Query the user's `location` from their profile
- Use PostGIS `ST_DWithin()` to find alerts whose `affected_area` is within 200km of the user
- Only return alerts where `expires_at > NOW()` (or `expires_at IS NULL`)

**Acceptance:**
- [ ] Inserting a test alert with an `affected_area` polygon near a test user's location → that alert appears in `GET /alerts`
- [ ] Alerts far from the user (>200km) do not appear
- [ ] Expired alerts do not appear

---

### Task 4.2: Build the Geofence check utility

**What:** Create `utils/geo.py` with a function that checks if a GPS coordinate is inside a restricted zone (MPA or IMBL).

**Why:** The Risk Agent calls this to warn fishermen before they cross into restricted waters.

**Implementation:**
1. Store MPA and IMBL boundary polygons in a `geofence_zones` table (GeoJSON → PostGIS)
2. Expose a function: `check_geofence(lat, lon) -> list[ZoneViolation]`
3. Use PostGIS `ST_Contains()` to check if the point falls inside any polygon

**Data source for boundaries:** Download EEZ and IMBL GeoJSON from https://www.marineregions.org/

**Acceptance:**
- [ ] A coordinate inside Indian EEZ returns no violations
- [ ] A coordinate near the Sri Lanka maritime boundary returns an IMBL warning
- [ ] Response time is under 100ms (PostGIS spatial index must be working)

---

## Phase 5 -- Integration & Hardening (Days 9-10)

### Task 5.1: Wire Samprikta's real LangGraph agents

**What:** Replace the mock agent in `agent_service.py` with Samprikta's actual LangGraph graph.

**Prerequisite:** Samprikta must have delivered `agents/graph.py` with a working `invoke()` method.

**Acceptance:**
- [ ] Sending "Is it safe to fish near Veraval?" returns a real response with INCOIS data
- [ ] The `evidence` field in the response contains actual data source citations
- [ ] Agent errors are caught gracefully and return a user-friendly error message

---

### Task 5.2: Add request validation & error handling

**What:** Ensure all endpoints have proper input validation and consistent error responses.

**Checklist:**
- [ ] All request bodies use Pydantic models with validation
- [ ] Invalid inputs return `422 Unprocessable Entity` with clear field-level errors
- [ ] Supabase errors return `500` with a generic message (never leak internal details)
- [ ] Groq API timeouts return `504 Gateway Timeout`
- [ ] Rate limiting: max 10 messages per minute per user (prevent API abuse)

---

### Task 5.3: Add CORS, security headers, and logging

**What:** Production-readiness hardening.

**Checklist:**
- [ ] CORS allows only the frontend origin (not `*`)
- [ ] All endpoints require a valid Supabase JWT (except health check)
- [ ] Add structured logging (use Python `logging` module) for every agent invocation
- [ ] Log agent response times for performance monitoring

---

## Summary -- What Blocks Whom

```
Isheeka's deliverable          →  Who is unblocked
─────────────────────────────────────────────────
Task 0.x (Scaffolding)         →  Isheeka herself (everything else)
Task 1.1 (Supabase project)    →  Biswanath (needs SUPABASE_URL + anon key)
Task 1.3 (Auth endpoints)      →  Biswanath (/login page)
Task 1.4 (Profile endpoints)   →  Biswanath (/onboarding page)
Task 2.1 (Chat endpoints)      →  Biswanath (/chat page)
Task 2.2 (Agent bridge mock)   →  Biswanath (can test full chat flow)
Task 2.2 (Agent bridge real)   →  Samprikta (agents need a backend to run in)
Task 3.1 (Whisper endpoint)    →  Biswanath (mic button)
Task 4.1 (Alerts endpoints)    →  Biswanath (/alerts page)
```

> **Bottom line:** Finish Phase 0 + Phase 1 within the first 2 days. Biswanath is completely blocked without auth and profile endpoints. Once those are up, he can build the entire frontend in parallel while you work on Phase 2-4.
