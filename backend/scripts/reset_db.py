"""
Clean Database - Drop All Tables, Enums, and Reset Alembic
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text


def clean_database():
    """Drop everything for a fresh start"""
    print("🧹 Cleaning database...")
    
    with engine.connect() as conn:
        # Drop tables
        tables = [
            "audit_logs", "task_comments", "tasks", 
            "id_sequences", "users", "companies", "alembic_version"
        ]
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            print(f"   ✅ Dropped table: {table}")
        
        # Drop ALL possible enum types
        enums = [
            "userstatus", "taskstatus", "taskpriority", "auditaction",
            "userrole", "taskcategory"  # Old enums
        ]
        for enum in enums:
            conn.execute(text(f"DROP TYPE IF EXISTS {enum} CASCADE"))
            print(f"   ✅ Dropped enum: {enum}")
        
        conn.commit()
    
    print("\n✅ Database is clean!")
    print("📝 Next: alembic revision --autogenerate -m 'initial_schema'")
    print("📝 Then: alembic upgrade head")


if __name__ == "__main__":
    clean_database()