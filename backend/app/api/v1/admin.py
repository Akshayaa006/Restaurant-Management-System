import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.order import Order
from app.models.schemas import OrderResponse, OrderStatusUpdate
from app.services.order import OrderService
from app.api.websockets import manager

router = APIRouter()


@router.get("/orders", response_model=List[OrderResponse])
async def get_all_orders(db_pg: AsyncSession = Depends(get_db)):
    """
    Retrieve all orders from the PostgreSQL database.
    Used by the Admin/KDS board to load current orders.
    """
    query = select(Order).order_by(Order.created_at.asc())
    result = await db_pg.execute(query)
    return result.scalars().all()


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID,
    status_update: OrderStatusUpdate,
    db_pg: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role([UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER])
    ),
):
    """
    Update the status of an existing order.
    Protected: Restricted to staff roles: ADMIN, KITCHEN, or WAITER.
    """
    updated_order = await OrderService.update_order_status(
        db_pg, order_id, status_update
    )
    if not updated_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
        
    # Broadcast status change to kitchen and specific customer client watching this order
    order_data = OrderResponse.from_attributes(updated_order).model_dump()
    order_data["id"] = str(order_data["id"])
    order_data["created_at"] = order_data["created_at"].isoformat()
    for item in order_data["items"]:
        item["id"] = str(item["id"])
        
    # Notify kitchen
    await manager.broadcast_kitchen({
        "event": "order_updated",
        "data": order_data
    })
    
    # Notify customer tracking socket
    await manager.send_order_update(str(order_id), {
        "event": "order_updated",
        "data": order_data
    })
    
    return updated_order

