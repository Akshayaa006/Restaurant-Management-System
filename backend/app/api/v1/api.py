from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.menu import router as menu_router
from app.api.v1.orders import router as orders_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

# Include all the sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(menu_router, prefix="/menu", tags=["Menu"])
api_router.include_router(orders_router, prefix="/orders", tags=["Orders"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Operations"])
