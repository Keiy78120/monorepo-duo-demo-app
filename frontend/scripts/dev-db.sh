#!/bin/bash

# Start local development database
echo "🚀 Starting local PostgreSQL..."

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q '^demo-app-db-dev$'; then
    echo "📦 Container exists, starting..."
    docker start demo-app-db-dev
else
    echo "📦 Creating new container..."
    docker-compose -f docker-compose.dev.yml up -d
fi

# Wait for DB to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec demo-app-db-dev pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Database ready at localhost:54322"
echo ""
echo "Connection: postgresql://postgres:postgres@localhost:54322/demo-app"
echo ""
echo "To stop: docker stop demo-app-db-dev"
echo "To reset: docker rm -f demo-app-db-dev && docker volume rm mini-app_demo-app_dev_data"
