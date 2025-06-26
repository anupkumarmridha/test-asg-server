-- Database initialization script for test-asg-server
-- This script will be executed when the PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE test_asg_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_asg_db')\gexec

-- Connect to the database
\c test_asg_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(status text, timestamp timestamptz, version text) AS
$$
BEGIN
    RETURN QUERY SELECT 
        'healthy'::text as status,
        now() as timestamp,
        version()::text as version;
END;
$$
LANGUAGE plpgsql;

-- Insert some initial data for testing
-- Note: Prisma will create the actual tables via migrations

-- Create a simple log for initialization
CREATE TABLE IF NOT EXISTS initialization_log (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO initialization_log (message) 
VALUES ('Database initialized successfully for test-asg-server');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE test_asg_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
