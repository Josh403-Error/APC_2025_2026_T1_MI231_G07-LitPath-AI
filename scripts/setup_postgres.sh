#!/bin/bash

echo "Setting up PostgreSQL database for LitPath AI..."

# Prompt for PostgreSQL superuser password
read -s -p "Enter PostgreSQL superuser (postgres) password: " PGPASSWORD
echo ""

# Create the database and user
echo "Creating database and user..."
export PGPASSWORD=$PGPASSWORD

# Connect to PostgreSQL and create database
psql -U postgres -h localhost << EOF
CREATE USER IF NOT EXISTS litpath_user WITH PASSWORD 'litpath_pass';
ALTER USER litpath_user CREATEDB;
CREATE DATABASE IF NOT EXISTS litpath_ai OWNER litpath_user;
GRANT ALL PRIVILEGES ON DATABASE litpath_ai TO litpath_user;
\c litpath_ai
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
EOF

if [ $? -eq 0 ]; then
    echo "Database setup completed successfully!"
    echo ""
    echo "Updated .env file with PostgreSQL configuration:"
    echo "DB_HOST=localhost"
    echo "DB_NAME=litpath_ai"
    echo "DB_USER=litpath_user"
    echo "DB_PASSWORD=litpath_pass"
    echo "DB_PORT=5432"
    
    # Update the .env file with new credentials
    sed -i 's/DB_USER=.*/DB_USER=litpath_user/' /home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend/.env
    sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=litpath_pass/' /home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend/.env
    sed -i 's/DB_NAME=.*/DB_NAME=litpath_ai/' /home/apcadmin/Documents/APC_2025_2026_T1_MI231_G07-LitPath-AI/backend/.env
    
    echo ""
    echo "Configuration updated in .env file."
else
    echo "Error occurred during database setup."
    exit 1
fi