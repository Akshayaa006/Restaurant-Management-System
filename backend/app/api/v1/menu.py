from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_mongodb
from app.core.security import require_role
from app.models.user import User, UserRole
from app.schemas.menu import MenuItem, MenuItemCreate, MenuItemUpdate
from app.services.menu import MenuService

router = APIRouter()


@router.get("", response_model=List[MenuItem])
async def get_active_menu(db: AsyncIOMotorDatabase = Depends(get_mongodb)):
    """
    Fetch all active and available menu items from MongoDB.
    No authentication required.
    """
    return await MenuService.get_active_menu(db)


@router.post("", response_model=MenuItem, status_code=status.HTTP_201_CREATED)
async def add_menu_item(
    item_in: MenuItemCreate,
    db: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Add a new menu item to MongoDB.
    Protected: Admin role required.
    """
    return await MenuService.create_menu_item(db, item_in)


@router.put("/{item_id}", response_model=MenuItem)
async def edit_menu_item(
    item_id: str,
    item_in: MenuItemUpdate,
    db: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Edit an existing menu item in MongoDB.
    Protected: Admin role required.
    """
    updated_item = await MenuService.update_menu_item(db, item_id, item_in)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item with ID {item_id} not found or invalid format.",
        )
    return updated_item
