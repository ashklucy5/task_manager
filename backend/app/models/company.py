"""
Company Model
Multi-tenant architecture with company_code for ID prefixing
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    """Company model for multi-tenant architecture"""
    
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Company code for ID prefixing (e.g., CA1, CA2, TECH1)
    company_code = Column(String(20), unique=True, nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Company(id={self.id}, company_code={self.company_code}, name={self.name})>"