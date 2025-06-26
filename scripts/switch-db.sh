#!/bin/bash

# Script to switch between Docker and AWS RDS database configurations
# Usage: ./scripts/switch-db.sh [docker|aws-rds]

set -e

DB_PROVIDER=${1:-""}

if [ -z "$DB_PROVIDER" ]; then
    echo "Usage: $0 [docker|aws-rds]"
    echo ""
    echo "Current configuration:"
    if [ -f .env ]; then
        grep "DB_PROVIDER" .env || echo "DB_PROVIDER not set"
    else
        echo ".env file not found"
    fi
    exit 1
fi

case $DB_PROVIDER in
    "docker")
        echo "Switching to Docker PostgreSQL configuration..."
        
        # Stop any running containers
        echo "Stopping any running containers..."
        docker-compose down 2>/dev/null || true
        
        # Copy Docker configuration
        if [ -f .env.example ]; then
            cp .env.example .env
        else
            echo "Creating Docker .env configuration..."
            cat > .env << 'EOF'
# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=test-asg-server
APP_VERSION=1.0.0

# Database Configuration - Docker
DB_PROVIDER=docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_asg_db?schema=public"

# Individual Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_asg_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_TYPE=postgresql
DB_SSL=false

# Other configurations...
ENABLE_CONSOLE_LOGGING=true
ENABLE_CORS=true
ENABLE_METRICS=true
HEALTH_CHECK_ENDPOINT=/health
EOF
        fi
        
        # Start PostgreSQL container
        echo "Starting PostgreSQL container..."
        docker-compose up -d postgres
        
        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Run Prisma migrations
        echo "Running Prisma database push..."
        npx prisma db push
        
        echo "✅ Successfully switched to Docker PostgreSQL!"
        echo "🐳 PostgreSQL is running on localhost:5432"
        echo "🚀 You can now start your application with: npm start"
        ;;
        
    "aws-rds")
        echo "Switching to AWS RDS configuration..."
        
        # Stop Docker containers
        echo "Stopping Docker containers..."
        docker-compose down 2>/dev/null || true
        
        # Copy AWS RDS template
        if [ -f .env.aws-rds ]; then
            cp .env.aws-rds .env
            echo "📋 Copied AWS RDS configuration template to .env"
            echo ""
            echo "⚠️  IMPORTANT: Update the following values in .env file:"
            echo "   - DB_HOST (RDS endpoint)"
            echo "   - DB_USER (RDS username)"
            echo "   - DB_PASSWORD (RDS password)"
            echo "   - DATABASE_URL (complete connection string)"
            echo ""
            echo "💡 You can get these values from your Terraform outputs:"
            echo "   terraform output -raw rds_endpoint"
            echo "   terraform output -raw rds_username"
            echo "   terraform output -raw rds_password"
            echo ""
            echo "After updating .env, run: npx prisma db push"
        else
            echo "❌ .env.aws-rds template not found!"
            exit 1
        fi
        
        echo "✅ Successfully switched to AWS RDS configuration!"
        echo "📝 Please update .env with your RDS credentials before starting the application"
        ;;
        
    *)
        echo "❌ Invalid option: $DB_PROVIDER"
        echo "Valid options: docker, aws-rds"
        exit 1
        ;;
esac

echo ""
echo "Current database provider: $DB_PROVIDER"
echo "Configuration file: .env"
