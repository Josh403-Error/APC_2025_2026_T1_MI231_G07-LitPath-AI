#!/bin/bash

echo "Starting LitPath AI Development Servers..."
echo "=========================================="

# Function to start backend
start_backend() {
    echo "Activating virtual environment..."
    source ./venv/bin/activate
    
    echo "Starting backend server..."
    cd ./backend
    python manage.py runserver 8000
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend server..."
    cd ./frontend
    npm run dev
}

# Check if we have two arguments to determine which server to start
case "$1" in
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    *)
        echo "Usage: $0 {backend|frontend}"
        echo "  backend  - Start the Django backend server"
        echo "  frontend - Start the React frontend server"
        echo ""
        echo "To start both servers:"
        echo "  Terminal 1: $0 backend"
        echo "  Terminal 2: $0 frontend"
        exit 1
        ;;
esac