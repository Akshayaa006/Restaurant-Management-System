from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.menu import MenuItem, MenuItemCreate, MenuItemUpdate


class MenuService:
    @staticmethod
    async def get_active_menu(db: AsyncIOMotorDatabase) -> List[MenuItem]:
        # Returns all items currently flagged as available
        cursor = db["menu_items"].find({"is_available": True})
        items = []
        async for doc in cursor:
            items.append(MenuItem.model_validate(doc))
        return items

    @staticmethod
    async def get_all_menu(db: AsyncIOMotorDatabase) -> List[MenuItem]:
        # Returns all menu items (including unavailable ones) for management
        cursor = db["menu_items"].find()
        items = []
        async for doc in cursor:
            items.append(MenuItem.model_validate(doc))
        return items

    @staticmethod
    async def get_menu_item_by_id(
        db: AsyncIOMotorDatabase, item_id: str
    ) -> Optional[MenuItem]:
        if not ObjectId.is_valid(item_id):
            return None
        doc = await db["menu_items"].find_one({"_id": ObjectId(item_id)})
        if doc:
            return MenuItem.model_validate(doc)
        return None

    @staticmethod
    async def create_menu_item(
        db: AsyncIOMotorDatabase, item: MenuItemCreate
    ) -> MenuItem:
        doc = item.model_dump(by_alias=True, exclude_none=True)
        result = await db["menu_items"].insert_one(doc)
        created_doc = await db["menu_items"].find_one(
            {"_id": result.inserted_id}
        )
        return MenuItem.model_validate(created_doc)

    @staticmethod
    async def update_menu_item(
        db: AsyncIOMotorDatabase, item_id: str, item_update: MenuItemUpdate
    ) -> Optional[MenuItem]:
        if not ObjectId.is_valid(item_id):
            return None
        update_data = item_update.model_dump(exclude_unset=True)
        if not update_data:
            return await MenuService.get_menu_item_by_id(db, item_id)

        await db["menu_items"].update_one(
            {"_id": ObjectId(item_id)}, {"$set": update_data}
        )
        return await MenuService.get_menu_item_by_id(db, item_id)
