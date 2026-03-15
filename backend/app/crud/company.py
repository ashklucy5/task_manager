"""
Company CRUD Operations
Auto-generates company_code if not provided
"""
from sqlalchemy.orm import Session
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate
from typing import Optional, List


def get_company(db: Session, company_id: int) -> Optional[Company]:
    """Get company by ID"""
    return db.query(Company).filter(Company.id == company_id).first()


def get_company_by_code(db: Session, code: str) -> Optional[Company]:
    """Get company by code"""
    return db.query(Company).filter(Company.code == code).first()


def get_company_by_company_code(db: Session, company_code: str) -> Optional[Company]:
    """Get company by company_code"""
    return db.query(Company).filter(Company.company_code == company_code).first()


def get_companies(db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
    """Get all companies with pagination"""
    return db.query(Company).offset(skip).limit(limit).all()


def _generate_company_code(db: Session) -> str:
    """
    Auto-generate company_code if not provided.
    Format: CA + next_available_number (e.g., CA1, CA2, CA3)
    """
    last_company = db.query(Company).filter(
        Company.company_code.like('CA%')
    ).order_by(Company.id.desc()).first()
    
    if not last_company or not last_company.company_code:
        return "CA1"
    
    try:
        last_number = int(last_company.company_code.replace("CA", ""))
        return f"CA{last_number + 1}"
    except (ValueError, AttributeError):
        return "CA1"


def create_company(db: Session, company: CompanyCreate) -> Company:
    """Create a new company. Auto-generates company_code if not provided."""
    company_code = company.company_code
    if not company_code:
        company_code = _generate_company_code(db)
    
    existing = get_company_by_company_code(db, company_code)
    if existing:
        raise ValueError(f"Company code '{company_code}' already exists")
    
    db_company = Company(
        company_code=company_code,
        name=company.name,
        code=company.code,
        description=company.description,
        is_active=company.is_active
    )
    
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return db_company


def update_company(db: Session, company_id: int, company_update: CompanyUpdate) -> Optional[Company]:
    """Update company"""
    db_company = get_company(db, company_id)
    if not db_company:
        return None
    
    update_data = company_update.model_dump(exclude_unset=True)
    
    if "company_code" in update_data:
        existing = get_company_by_company_code(db, update_data["company_code"])
        if existing and existing.id != company_id:
            raise ValueError(f"Company code '{update_data['company_code']}' already exists")
    
    for field, value in update_data.items():
        setattr(db_company, field, value)
    
    db.commit()
    db.refresh(db_company)
    return db_company


def delete_company(db: Session, company_id: int) -> bool:
    """Delete company (cascades to users)"""
    db_company = get_company(db, company_id)
    if not db_company:
        return False
    
    db.delete(db_company)
    db.commit()
    return True