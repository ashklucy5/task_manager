"""
ID Sequence Model
Tracks ID generation sequences per company/role/parent
"""
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class IDSequence(Base):
    """Track ID sequences for hierarchical user IDs"""
    
    __tablename__ = "id_sequences"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Sequence scope
    company_id = Column(Integer, nullable=False, index=True)  # Company scope
    parent_id = Column(String(50), nullable=True, index=True)  # Parent user ID
    role_type = Column(String(50), nullable=False, index=True)  # super_admin, admin, member
    
    # Current sequence number
    current_value = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Unique constraint: one sequence per company/parent/role combination
    __table_args__ = (
        UniqueConstraint('company_id', 'parent_id', 'role_type', name='uq_id_sequence_scope'),
    )
    
    def __repr__(self):
        return f"<IDSequence(company_id={self.company_id}, role={self.role_type}, value={self.current_value})>"