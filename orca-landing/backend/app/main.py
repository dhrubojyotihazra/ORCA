import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.user import router as user_router
from app.routers.chat import router as chat_router
from app.routers.voice import router as voice_router
from app.routers.alerts import router as alerts_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("orca_backend")

app = FastAPI(
    title="ORCA API",
    description="Ocean Risk & Coastal Analytics API Service for Fishermen Safety and Fleet Intelligence",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter: sliding window for chat & voice endpoints
import time
from collections import defaultdict
RATE_LIMIT_WINDOW_SEC = 60
MAX_REQUESTS_PER_WINDOW = 60
_request_timestamps = defaultdict(list)

@app.middleware("http")
async def performance_and_rate_limit_middleware(request: Request, call_next):
    start_time = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    if path.startswith(("/api/v1/chat", "/api/v1/voice")):
        now = time.time()
        _request_timestamps[client_ip] = [ts for ts in _request_timestamps[client_ip] if now - ts < RATE_LIMIT_WINDOW_SEC]
        if len(_request_timestamps[client_ip]) >= MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Please wait a moment before sending more requests.", "status": "rate_limited"}
            )
        _request_timestamps[client_ip].append(now)

    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Invalid request payload or parameters."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "status": "error"}
    )

# Register API routers under /api/v1
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(user_router, prefix=api_v1_prefix)
app.include_router(chat_router, prefix=api_v1_prefix)
app.include_router(voice_router, prefix=api_v1_prefix)
app.include_router(alerts_router, prefix=api_v1_prefix)

@app.get("/")
async def root_health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "0.1.0", "service": "ORCA Backend"}
