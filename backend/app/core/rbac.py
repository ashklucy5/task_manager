from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.models.user import User, UserRole


def require_role(required_role: UserRole):
    """
    Middleware to protect endpoints by role.
    Owner can access everything.
    """
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        # Owner can access everything
        if current_user.role == UserRole.OWNER:
            return current_user
        
        # Define role hierarchy
        role_hierarchy = {
            UserRole.OWNER: 3,
            UserRole.ADMIN: 2,
            UserRole.EMPLOYEE: 1
        }
        
        # Check if user has sufficient permissions
        if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user
    
    return role_checker


def require_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Special guard for financial data and sensitive operations.
    Only Owner can access.
    """
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Financial data access denied. Owner privileges required."
        )
    return current_user


def can_view_financials(current_user: User) -> bool:
    """Check if user can view financial data"""
    return current_user.role == UserRole.OWNER


def can_manage_users(current_user: User) -> bool:
    """Check if user can manage other users"""
    return current_user.role in [UserRole.OWNER, UserRole.ADMIN]


def can_assign_tasks(current_user: User) -> bool:
    """Check if user can assign tasks"""
    return current_user.role in [UserRole.OWNER, UserRole.ADMIN]