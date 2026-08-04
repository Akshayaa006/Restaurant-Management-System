from typing import List, Optional
from pydantic import BaseModel, Field, BeforeValidator
from typing_extensions import Annotated

# Helper type to transform MongoDB ObjectId to string
PyObjectId = Annotated[str, BeforeValidator(str)]


class CustomizationOption(BaseModel):
    name: str
    price_modifier: float = 0.0


class CustomizationGroup(BaseModel):
    name: str
    required: bool = False
    max_selected: int = 1
    options: List[CustomizationOption]


class MenuItemBase(BaseModel):
    name: str
    category: str
    base_price: float = Field(..., gt=0.0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    dietary_tags: List[str] = Field(default_factory=list)
    is_available: bool = True
    customization_groups: List[CustomizationGroup] = Field(default_factory=list)


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0.0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    dietary_tags: Optional[List[str]] = None
    is_available: Optional[bool] = None
    customization_groups: Optional[List[CustomizationGroup]] = None


class MenuItem(MenuItemBase):
    # Field to map Mongo's BSON _id into Pydantic ID string
    id: PyObjectId = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
