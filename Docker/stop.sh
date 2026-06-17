#!/bin/bash

# Script to stop the LitPath AI Docker containers

echo "Stopping LitPath AI Full-Stack Docker Deployment..."

# Navigate to the Docker directory
cd "$(dirname "$0")"

# Stop all services
docker-compose down

echo "All services have been stopped."
echo ""
echo "To start the application again, run: ./build-and-run.sh"