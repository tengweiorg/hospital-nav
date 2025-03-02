from ninja import Schema
from typing import List, Optional
from datetime import datetime

class CategorySchema(Schema):
    id: int
    name: str
    icon: Optional[str] = None
    order: int

class WebsiteSchema(Schema):
    id: int
    name: str
    url: str
    icon: Optional[str] = None
    description: Optional[str] = None
    order: int
    clicks: int

class CategoryWithWebsitesSchema(CategorySchema):
    order: int
    websites: List[WebsiteSchema]

class SearchResultSchema(Schema):
    id: int
    name: str
    url: str
    category_name: str