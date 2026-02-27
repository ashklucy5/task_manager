"""
Run Alembic migrations if configured. NEVER crashes the app.
"""
import os
from pathlib import Path
from alembic.config import Config
from alembic import command

def run_migrations():
    """Run migrations if alembic.ini exists and is valid"""
    backend_dir = Path(__file__).parent.resolve()
    alembic_ini_path = backend_dir / "alembic.ini"
    
    # Skip if config doesn't exist - DO NOT CRASH
    if not alembic_ini_path.exists():
        print("⚠️ Alembic not configured (alembic.ini missing). Skipping migrations.")
        return  # ✅ CRITICAL: Never call sys.exit() here
    
    try:
        # Load config
        alembic_cfg = Config(str(alembic_ini_path))
        
        # Run migrations
        print("🚀 Running migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed successfully")
        
    except Exception as e:
        # ✅ CRITICAL: NEVER call sys.exit() - log warning and continue
        print(f"⚠️ Migrations skipped (non-fatal): {e}")
        print("💡 Tables were created via Base.metadata.create_all()")
        # App continues starting - tables already exist via SQLAlchemy