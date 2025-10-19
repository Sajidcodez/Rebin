from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import time
import os

from routes.infer import router as infer_router
from routes.explain import router as explain_router
from routes.event import router as event_router
from routes.chatbot import router as chatbot_router
from routes.analytics import router as analytics_router
from routes.users import router as users_router
from utils.supabase_client import ensure_seed_policies
from utils.settings import FRONTEND_ORIGIN


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application with CORS, security middleware, and routes.
    """
    app = FastAPI(
        title="ReBin Pro API", 
        version="1.0.0",
        description="AI-Powered Waste Sorting API",
        docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
        redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
    )

    # Security middleware - Allow Render.com hosts
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["localhost", "127.0.0.1", "*.onrender.com", "*.your-domain.com"]
    )

    # CORS middleware - Allow multiple origins for development
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",  # Vite alternate port
    ]
    
    # Add production frontend origin if set
    if FRONTEND_ORIGIN:
        allowed_origins.append(FRONTEND_ORIGIN)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint for load balancers and monitoring."""
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "timestamp": time.time(),
                "version": "1.0.0"
            }
        )

    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return JSONResponse(
            status_code=200,
            content={
                "message": "ReBin Pro API",
                "version": "1.0.0",
                "docs": "/docs" if os.getenv("ENVIRONMENT") != "production" else "Documentation disabled in production"
            }
        )

    # Include routers
    app.include_router(infer_router, prefix="/infer", tags=["infer"])
    app.include_router(explain_router, prefix="/explain", tags=["explain"])
    app.include_router(event_router, prefix="/event", tags=["event"])
    app.include_router(chatbot_router, prefix="/chatbot", tags=["chatbot"])
    app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
    app.include_router(users_router, prefix="/users", tags=["users"])

    @app.on_event("startup")
    async def startup_event() -> None:
        logger.info("Starting ReBin Pro API")
        await ensure_seed_policies()

    return app


app = create_app()
