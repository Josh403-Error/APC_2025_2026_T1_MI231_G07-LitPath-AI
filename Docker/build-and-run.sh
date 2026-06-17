#!/bin/bash

# Script to build and run the full-stack LitPath AI application using Docker

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting LitPath AI Full-Stack Docker Deployment..."

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed." >&2
  exit 1
fi

# Check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: Docker Compose is not installed." >&2
  exit 1
fi

# Navigate to the Docker directory
cd "$(dirname "$0")"

echo "Building and starting the LitPath AI services..."

# Build and start all services in detached mode
docker-compose up --build -d

echo "Waiting for services to start..."
sleep 30

# Check the status of all services
echo "Checking service status..."
docker-compose ps

echo ""
echo "LitPath AI Full-Stack Application is now running!"
echo ""
echo "Access the application at:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost/api/"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop the application: docker-compose down"
echo ""

# Run Django migrations if the backend is ready
echo "Running Django migrations..."
sleep 10
docker-compose exec backend python manage.py migrate

echo "Seeding admin users..."
docker-compose exec backend python manage.py seed_admins

echo ""
echo "Setup completed successfully!"