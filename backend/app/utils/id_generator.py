"""
Hierarchical ID Generator
Format: {company_code}-S-000001, {company_code}-S-000001-A-00001, etc.
Each company has independent sequences starting from 1
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.id_sequence import IDSequence
from app.models.company import Company
from typing import Optional


def get_next_sequence(
    db: Session,
    company_id: int,
    role_type: str,
    parent_id: Optional[str] = None
) -> int:
    """
    Get next sequence number for ID generation.
    Scoped by company_id - each company has independent sequences.
    """
    sequence = db.query(IDSequence).filter(
        and_(
            IDSequence.company_id == company_id,
            IDSequence.role_type == role_type,
            IDSequence.parent_id == parent_id
        )
    ).first()
    
    if not sequence:
        sequence = IDSequence(
            company_id=company_id,
            role_type=role_type,
            parent_id=parent_id,
            current_value=0
        )
        db.add(sequence)
        db.commit()
        db.refresh(sequence)
    
    sequence.current_value += 1
    db.commit()
    
    return sequence.current_value


def get_company_code(db: Session, company_id: int) -> str:
    """Get company_code for a company (e.g., CA1, CA2)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise ValueError(f"Company {company_id} not found")
    return company.company_code


def generate_user_id(
    db: Session,
    role: str,
    company_id: int,
    parent_id: Optional[str] = None
) -> str:
    """
    Generate structured hierarchical user ID with company_code prefix.
    
    Format:
    - SuperAdmin: {company_code}-S-000001 (e.g., CA1-S-000001)
    - Admin: {company_code}-S-000001-A-00001 (e.g., CA1-S-000001-A-00001)
    - Member: {company_code}-S-000001-A-00001-M-0000001 (e.g., CA1-S-000001-A-00001-M-0000001)
    
    Each company starts from 1 independently!
    """
    company_code = get_company_code(db, company_id)
    
    if role == "super_admin":
        sequence = get_next_sequence(db, company_id, "super_admin")
        return f"{company_code}-S-{sequence:06d}"
    
    elif role == "admin":
        if not parent_id:
            raise ValueError("Admin must have a parent SuperAdmin ID")
        sequence = get_next_sequence(db, company_id, "admin", parent_id)
        return f"{parent_id}-A-{sequence:05d}"
    
    elif role == "member":
        if not parent_id:
            raise ValueError("Member must have a parent Admin ID")
        sequence = get_next_sequence(db, company_id, "member", parent_id)
        return f"{parent_id}-M-{sequence:07d}"
    
    else:
        raise ValueError(f"Invalid role: {role}")