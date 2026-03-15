"""
Fresh Start - Complete Database Reset
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text


def fresh_start():
    """Drop everything for a clean start"""
    print("=" * 70)
    print("🔄 FRESH START - Complete Database Reset")
    print("=" * 70)
    
    confirm = input("⚠️  This will DELETE ALL data. Type 'RESET' to confirm: ")
    if confirm.strip().upper() != "RESET":
        print("❌ Cancelled")
        return
    
    with engine.connect() as conn:
        print("\n🗑️  Dropping tables...")
        tables = ["audit_logs", "task_comments", "tasks", "id_sequences", "users", "companies", "alembic_version"]
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            print(f"   ✅ {table}")
        
        print("\n🗑️  Dropping enum types...")
        enums = ["userstatus", "taskstatus", "taskpriority", "auditaction", "userrole", "taskcategory"]
        for enum in enums:
            conn.execute(text(f"DROP TYPE IF EXISTS {enum} CASCADE"))
            print(f"   ✅ {enum}")
        
        conn.commit()
    
    print("\n✅ Database is clean!")
    print("📝 Next: alembic revision --autogenerate -m 'initial_schema'")
    print("📝 Then: alembic upgrade head")
    print("📝 Company 1 SuperAdmin will get: CA1-S-000001")


if __name__ == "__main__":
    fresh_start()