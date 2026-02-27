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
    
    # Skip if config doesn't exist
    if not alembic_ini_path.exists():
        print("⚠️ Alembic not configured (alembic.ini missing). Skipping migrations.")
        return
    
    try:
        # Load config with explicit script_location
        alembic_cfg = Config(str(alembic_ini_path))
        script_location = str(backend_dir / "alembic")
        
        # Only set script_location if missing from config
        if not alembic_cfg.get_main_option("script_location"):
            alembic_cfg.set_main_option("script_location", script_location)
        
        # Run migrations
        print(f"🚀 Running migrations from: {script_location}")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed successfully")
        
    except Exception as e:
        # NEVER crash the app - log and continue
        print(f"⚠️ Migrations skipped (non-fatal): {e}")
        print("💡 Tables were created via Base.metadata.create_all()")