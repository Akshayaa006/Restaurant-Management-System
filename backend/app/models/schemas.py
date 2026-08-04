import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.order import OrderStatus, OrderType
from app.models.user import UserRole


# --- Auth & Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.WAITER


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: uuid.UUID

    model_config = {
        "from_attributes": True,
    }


# --- Order Item Schemas ---
class OrderItemCreate(BaseModel):
    menu_item_id: str = Field(..., description="MongoDB MenuItem ObjectId string")
    quantity: int = Field(..., gt=0, description="Quantity ordered")
    selected_options: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key-value mapping of option group names to selected option names",
    )


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: str
    quantity: int
    item_price: float
    selected_options: Dict[str, Any]

    model_config = {
        "from_attributes": True,
    }


# --- Order Schemas ---
class OrderCreate(BaseModel):
    table_number: Optional[int] = Field(
        None, description="Table number for dine-in orders"
    )
    order_type: OrderType = Field(..., description="DINE_IN or TAKEAWAY")
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(BaseModel):
    id: uuid.UUID
    table_number: Optional[int]
    order_type: OrderType
    status: OrderStatus
    subtotal: float
    tax: float
    total: float
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = {
        "from_attributes": True,
    }


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
