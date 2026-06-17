# LitPath AI - Full Stack Docker Deployment

This directory contains the Docker configuration files for deploying the full-stack LitPath AI application.

## Overview

The full-stack deployment includes:

- **Frontend**: React 19 application built with Vite
- **Backend**: Django 5.0 REST API
- **Database**: PostgreSQL for structured data
- **Vector Database**: ChromaDB for RAG functionality
- **Reverse Proxy**: Nginx for routing requests

## Prerequisites

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB of RAM available for Docker
- Google API key for Gemini integration
- Supabase credentials for authentication (optional)

## Setup Instructions

### 1. Prepare Environment Variables

Create a `.env` file in the Docker directory with the following variables:

```bash
GOOGLE_API_KEY=your_google_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your_django_secret_key
DEBUG=0
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:postgres@db:5432/litpath_db
```

### 2. Build and Run the Application

Execute the build and run script:

```bash
chmod +x build-and-run.sh
./build-and-run.sh
```

This will:
- Build all Docker images
- Start all services
- Run database migrations
- Seed admin users

### 3. Access the Application

Once the services are running:

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/
- **Admin Panel**: http://localhost/admin/ (credentials: admin@litpath.local / adminpass123)

### 4. View Logs

To monitor the application:

```bash
docker-compose logs -f
```

## Service Architecture

```
Internet
    |
Nginx (Port 80)
    |
-----------------------------------
    |              |
Frontend      Backend
(Service)    (Service)
    |              |
    |          PostgreSQL
    |          (Database)
    |
ChromaDB
(Vector DB)
```

## Management Commands

- **Start**: `./build-and-run.sh`
- **Stop**: `./stop.sh`
- **View logs**: `docker-compose logs -f`
- **Execute backend command**: `docker-compose exec backend python manage.py <command>`
- **Restart specific service**: `docker-compose restart <service-name>`

## Troubleshooting

### Common Issues

1. **Permission denied when running Docker**
   - Ensure your user is in the docker group: `sudo usermod -aG docker $USER`
   - Log out and log back in for changes to take effect

2. **Port already in use**
   - Check for running containers: `docker ps`
   - Stop conflicting services or modify ports in `docker-compose.yml`

3. **Insufficient memory**
   - Increase Docker's memory allocation in Docker Desktop settings
   - Minimum recommended: 4GB RAM

4. **Database connection errors**
   - Wait for PostgreSQL to fully initialize (may take 30-60 seconds)
   - Check logs: `docker-compose logs db`

### Useful Commands

```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs backend
docker-compose logs db

# Execute Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Access database console
docker-compose exec db psql -U postgres -d litpath_db
```

## Security Considerations

- Change default passwords before production deployment
- Use HTTPS in production (modify nginx.conf to include SSL configuration)
- Implement proper firewall rules
- Regularly update base images
- Audit environment variables containing sensitive information

## Production Deployment Notes

For production deployment:

1. Enable HTTPS by adding SSL certificates to the `ssl/` directory
2. Update `ALLOWED_HOSTS` in Django settings
3. Use a production-grade PostgreSQL setup
4. Implement proper backup strategies
5. Configure monitoring and alerting
6. Set up a CDN for static assets