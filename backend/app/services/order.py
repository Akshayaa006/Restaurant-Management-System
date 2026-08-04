import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.order import Order, OrderItem, OrderStatus
from app.models.schemas import OrderCreate, OrderStatusUpdate
from app.services.menu import MenuService


class OrderService:
    @staticmethod
    async def create_order(
        db_pg: AsyncSession,
        db_mongo: AsyncIOMotorDatabase,
        order_in: OrderCreate,
    ) -> Order:
        subtotal = 0.0
        order_items = []

        for item in order_in.items:
            # 1. Fetch MenuItem from MongoDB to get official price configuration
            menu_item = await MenuService.get_menu_item_by_id(
                db_mongo, item.menu_item_id
            )
            if not menu_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MenuItem with id {item.menu_item_id} not found.",
                )
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"MenuItem '{menu_item.name}' is currently out of stock.",
                )

            # 2. Compute final unit price including dynamic customization price modifiers
            unit_price = menu_item.base_price

            for group_name, selected_val in item.selected_options.items():
                # Find customization group matching option list
                group = next(
                    (
                        g
                        for g in menu_item.customization_groups
                        if g.name == group_name
                    ),
                    None,
                )
                if not group:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Customization group '{group_name}' is not valid for menu item '{menu_item.name}'.",
                    )

                # Ensure choice is mapped as a list to support multi-select options
                selections = (
                    [selected_val]
                    if isinstance(selected_val, str)
                    else selected_val
                )
                if not isinstance(selections, list):
                    selections = [str(selections)]

                for option_name in selections:
                    opt = next(
                        (o for o in group.options if o.name == option_name),
                        None,
                    )
                    if not opt:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Option '{option_name}' not found under customization group '{group_name}'.",
                        )
                    unit_price += opt.price_modifier

            # 3. Sum item subtotal
            item_total = unit_price * item.quantity
            subtotal += item_total

            # Create OrderItem object
            order_item = OrderItem(
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                item_price=round(unit_price, 2),
                selected_options=item.selected_options,
            )
            order_items.append(order_item)

        # 4. Calculate Tax (10% standard VAT) and Total server-side
        tax_rate = 0.10
        tax = round(subtotal * tax_rate, 2)
        total = round(subtotal + tax, 2)
        subtotal = round(subtotal, 2)

        # 5. Build and save the Order parent record
        db_order = Order(
            table_number=order_in.table_number,
            order_type=order_in.order_type,
            status=OrderStatus.PENDING,
            subtotal=subtotal,
            tax=tax,
            total=total,
            items=order_items,
        )

        db_pg.add(db_order)
        await db_pg.commit()
        await db_pg.refresh(db_order)
        return db_order

    @staticmethod
    async def get_order_by_id(
        db_pg: AsyncSession, order_id: uuid.UUID
    ) -> Optional[Order]:
        query = select(Order).where(Order.id == order_id)
        result = await db_pg.execute(query)
        return result.scalar_or_none()

    @staticmethod
    async def update_order_status(
        db_pg: AsyncSession,
        order_id: uuid.UUID,
        status_update: OrderStatusUpdate,
    ) -> Optional[Order]:
        db_order = await OrderService.get_order_by_id(db_pg, order_id)
        if not db_order:
            return None

        db_order.status = status_update.status
        await db_pg.commit()
        await db_pg.refresh(db_order)
        return db_order
