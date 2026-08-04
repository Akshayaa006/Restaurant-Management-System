from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import mongodb_manager
from app.api.v1.api import api_router
from app.api.websockets import router as websockets_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Initializing application resources...")
    print("Connecting to MongoDB...")
    mongodb_manager.connect()
    yield
    # Shutdown actions
    print("Closing application resources...")
    print("Disconnecting from MongoDB...")
    mongodb_manager.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount WebSockets router
app.include_router(websockets_router)


# Configure CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health", tags=["Health"], status_code=200)
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
    }


# --- SPA Frontend Mounting ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
import os

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.exists(frontend_dir):
    dist_dir = os.path.join(frontend_dir, "dist")
    if os.path.exists(dist_dir):
        app.mount("/dist", StaticFiles(directory=dist_dir), name="dist")

    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        # Prevent intercepting API, WebSocket, and Health routes
        if (
            catchall.startswith("api") 
            or catchall.startswith("ws") 
            or catchall.startswith("health")
        ):
            raise HTTPException(status_code=404, detail="Not Found")
        
        index_file = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

