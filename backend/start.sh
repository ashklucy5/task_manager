#!/bin/bash
set -e

cd /home/alltradebd/backend
source /home/alltradebd/virtualenv/backend/3.12/bin/activate

echo "🚀 Starting NexusFlow AI Backend..."

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Start the server (backgrounded, local-only port)
echo "🌐 Starting FastAPI server..."
mkdir -p logs
nohup uvicorn app.main:app --host 127.0.0.1 --port 8001 >> logs/uvicorn.log 2>&1 &
echo $! > uvicorn.pid
echo "✅ Started with PID $(cat uvicorn.pid)"