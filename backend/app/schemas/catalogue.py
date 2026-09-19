from __future__ import annotations

from pydantic import BaseModel, Field


class CatalogueDescription(BaseModel):
    en: str
    hi: str
    mr: str


class CatalogueGenerateRequest(BaseModel):
    product_id: str | None = None
    transcript: str
    source_language: str = "mr"
    category: str | None = None
    materials: list[str] | None = None
    extra_details: str = ""


class CatalogueGenerateResponse(BaseModel):
    product_id: str | None = None
    name: str
    category: str
    materials: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    description: CatalogueDescription
    provider: str
