"""
Automatically create PostgreSQL database if it doesn't exist.
Uses ONLY raw psycopg2 (no SQLAlchemy transactions) to avoid isolation errors.
"""
import sys
import time
import psycopg2
from urllib.parse import urlparse
from app.core.config import settings

def wait_for_postgres(max_retries=10, delay=2):
    """Wait for PostgreSQL to become available"""
    for i in range(max_retries):
        try:
            parsed = urlparse(settings.DATABASE_URL.replace('/nexusflow', '/postgres'))
            conn = psycopg2.connect(
                host=parsed.hostname or 'localhost',
                port=parsed.port or 5432,
                database='postgres',
                user=parsed.username or 'postgres',
                password=parsed.password
            )
            conn.close()
            print(f"✅ PostgreSQL is ready (attempt {i+1}/{max_retries})")
            return True
        except Exception as e:
            print(f"⏳ Waiting for PostgreSQL... ({i+1}/{max_retries})")
            time.sleep(delay)
    return False

def database_exists(dbname: str) -> bool:
    """Check if database exists using raw psycopg2"""
    try:
        parsed = urlparse(settings.DATABASE_URL.replace('/nexusflow', '/postgres'))
        conn = psycopg2.connect(
            host=parsed.hostname or 'localhost',
            port=parsed.port or 5432,
            database='postgres',
            user=parsed.username or 'postgres',
            password=parsed.password
        )
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
            return cur.fetchone() is not None
    except Exception:
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def create_database_if_not_exists():
    """Create nexusflow database if it doesn't exist"""
    if not wait_for_postgres():
        print("❌ PostgreSQL not available. Skipping DB creation.")
        return
    
    if database_exists('nexusflow'):
        print("✅ Database 'nexusflow' already exists")
        return
    
    try:
        parsed = urlparse(settings.DATABASE_URL.replace('/nexusflow', '/postgres'))
        conn = psycopg2.connect(
            host=parsed.hostname or 'localhost',
            port=parsed.port or 5432,
            database='postgres',
            user=parsed.username or 'postgres',
            password=parsed.password
        )
        conn.autocommit = True
        
        with conn.cursor() as cur:
            cur.execute("CREATE DATABASE nexusflow ENCODING 'UTF8'")
            print("✅ Created database 'nexusflow'")
    except psycopg2.errors.DuplicateDatabase:
        print("✅ Database 'nexusflow' already exists (race condition)")
    except Exception as e:
        print(f"⚠️ Failed to create database (may already exist): {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🔧 Initializing PostgreSQL database...")
    create_database_if_not_exists()
    print("✅ Database initialization complete")