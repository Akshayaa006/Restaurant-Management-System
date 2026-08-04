import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db, get_mongodb
from app.models.schemas import OrderCreate, OrderResponse
from app.services.order import OrderService
from app.api.websockets import manager

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db_pg: AsyncSession = Depends(get_db),
    db_mongo: AsyncIOMotorDatabase = Depends(get_mongodb),
):
    """
    Validate order payload, compute unit prices, taxes, subtotals,
    persist in PostgreSQL, and notify KDS via WebSocket.
    """
    try:
        order = await OrderService.create_order(db_pg, db_mongo, order_in)
        
        # Broadcast the newly created order to all kitchen screens
        order_data = OrderResponse.from_attributes(order).model_dump()
        # Convert UUID and datetime to string JSON-serializable types
        order_data["id"] = str(order_data["id"])
        order_data["created_at"] = order_data["created_at"].isoformat()
        for item in order_data["items"]:
            item["id"] = str(item["id"])
            
        await manager.broadcast_kitchen({
            "event": "order_created",
            "data": order_data
        })
        
        return order
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}",
        )



@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: uuid.UUID, db_pg: AsyncSession = Depends(get_db)
):
    """
    Fetch single order details and item configurations.
    """
    order = await OrderService.get_order_by_id(db_pg, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    return order
