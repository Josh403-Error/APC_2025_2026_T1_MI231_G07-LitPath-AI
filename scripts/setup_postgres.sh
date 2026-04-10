#!/bin/bash

echo "Setting up PostgreSQL for LitPath AI..."

# Create the database and user if they don't exist
sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE litpath_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'litpath_db')\gexec
SELECT 'CREATE USER litpath_user WITH PASSWORD '\''litpath_pass'\''' WHERE NOT EXISTS (SELECT FROM pg_user WHERE usename = 'litpath_user')\gexec
GRANT ALL PRIVILEGES ON DATABASE litpath_db TO litpath_user;
ALTER USER litpath_user CREATEDB;
EOF

echo "PostgreSQL setup completed!"
echo "Database: litpath_db"
echo "User: litpath_user"
echo "Password: litpath_pass"
echo ""
echo "You can now run migrations with: python manage.py migrate"