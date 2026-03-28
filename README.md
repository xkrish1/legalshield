# 🛡 LeaseShield

AI-powered lease risk analyzer. Upload a lease PDF, get plain-English risk analysis, exit letters, and more.

## One-time setup

```bash
chmod +x setup.sh start.sh
./setup.sh
```

## Run

```bash
./start.sh
```

Open **http://localhost:5173**

## Requirements
- Python 3.10+
- Node.js 18+
- Ollama — https://ollama.com (free, local, no API key)

## Features
- 📄 Lease clause analysis (8 clause types)
- 🔴 Risk scoring with visual gauge
- ✉️ Exit letter generator
- 🏠 Landlord response simulator
- ⚖️ Lawyer finder
- 🗺 Lease comparison map

## Stack
- Backend: Flask + Python + Ollama (llama3.2:3b)
- Frontend: React + Vite + Leaflet
- DB: SQLite (auto-created)
