#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        LeaseShield Setup             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 not found. Install from https://python.org"
  exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Check Ollama
if ! command -v ollama &> /dev/null; then
  echo "❌ Ollama not found. Install from https://ollama.com then re-run this script."
  exit 1
fi

echo "✅ Python3, Node.js, Ollama found"
echo ""

# Pull model if not present
echo "📦 Checking for llama3.2:3b model..."
if ollama list | grep -q "llama3.2:3b"; then
  echo "✅ llama3.2:3b already pulled"
else
  echo "⬇️  Pulling llama3.2:3b (~2GB, please wait)..."
  ollama pull llama3.2:3b
fi

echo ""
echo "🔧 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
echo "✅ Backend dependencies installed"

echo ""
echo "🔧 Setting up frontend..."
cd ../frontend
npm install --silent
echo "✅ Frontend dependencies installed"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Setup complete! Now run:           ║"
echo "║   ./start.sh                         ║"
echo "╚══════════════════════════════════════╝"
