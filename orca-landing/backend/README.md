# ORCA Backend API Service

FastAPI-powered backend for ORCA (Ocean Risk & Coastal Analytics), integrating Supabase (PostGIS + Auth + Database), Groq Whisper & LLMs, and LangGraph agents.

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and update credentials.

3. Run development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Open API documentation:
   - Interactive docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/
