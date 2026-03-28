#!/bin/bash

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       Starting LeaseShield           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Kill anything on our ports from previous runs
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start Ollama in background (safe to call even if already running)
echo "🤖 Starting Ollama..."
ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!
sleep 2

# Start Flask backend
echo "🐍 Starting Flask backend on port 5001..."
cd backend
source venv/bin/activate
python app.py > /tmp/flask.log 2>&1 &
FLASK_PID=$!
cd ..
sleep 2

# Start Vite frontend
echo "⚛️  Starting React frontend on port 5173..."
cd frontend
npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!
cd ..
sleep 3

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ✅ LeaseShield is running!          ║"
echo "║                                      ║"
echo "║  Open: http://localhost:5173         ║"
echo "║                                      ║"
echo "║  Press Ctrl+C to stop all           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Trap Ctrl+C and kill all child processes
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  kill $OLLAMA_PID $FLASK_PID $VITE_PID 2>/dev/null || true
  lsof -ti:5001 | xargs kill -9 2>/dev/null || true
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  echo "Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Keep running
wait
