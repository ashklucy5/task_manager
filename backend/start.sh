#!/bin/bash
set -e

cd /home/alltradebd/backend
source /home/alltradebd/virtualenv/backend/3.12/bin/activate

echo "🚀 Starting NexusFlow AI Backend..."

echo "🗄️ Running database migrations..."
alembic upgrade head

echo "🌐 Starting FastAPI server..."
mkdir -p logs
nohup uvicorn app.main:app --host 127.0.0.1 --port 8001 >> logs/uvicorn.log 2>&1 < /dev/null &
disown
echo $! > uvicorn.pid
echo "✅ Started with PID $(cat uvicorn.pid)"