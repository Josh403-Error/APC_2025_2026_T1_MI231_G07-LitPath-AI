-- PostgreSQL initialization script for LitPath AI

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE litpath_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'litpath_db')\gexec

-- Connect to the database
\c litpath_db;

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Additional database setup can go here if needed