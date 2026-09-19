from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EnquiryCreate(BaseModel):
    productId: str | None = None
    productName: str | None = None
    name: str
    contact: str
    message: str


class EnquiryUpdate(BaseModel):
    status: str | None = None
    response_message: str | None = None


class EnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    buyer: str
    buyer_name: str | None = None
    buyer_contact: str | None = None
    productId: str | None = None
    productName: str
    message: str
    response_message: str | None = None
    date: str
    status: str
    isDemo: bool = False
    created_at: datetime | None = None
