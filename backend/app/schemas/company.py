"""
Company Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CompanyCreate(BaseModel):
    """Schema for creating a new company"""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    
    # Optional company_code (auto-generated if not provided)
    company_code: Optional[str] = Field(None, min_length=1, max_length=20)
    
    is_active: bool = True
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "TechCorp Solutions",
                "code": "TECH1",
                "description": "Technology Company 1",
                "company_code": "CA1"
            }
        }
    }


class CompanyUpdate(BaseModel):
    """Schema for updating a company"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    company_code: Optional[str] = Field(None, min_length=1, max_length=20)
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    """Schema for company response"""
    id: int
    company_code: str
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}