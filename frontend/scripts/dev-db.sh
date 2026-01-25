#!/bin/bash

# Start local development database
echo "🚀 Starting local PostgreSQL..."

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q '^vhash-db-dev$'; then
    echo "📦 Container exists, starting..."
    docker start vhash-db-dev
else
    echo "📦 Creating new container..."
    docker-compose -f docker-compose.dev.yml up -d
fi

# Wait for DB to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec vhash-db-dev pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Database ready at localhost:54322"
echo ""
echo "Connection: postgresql://postgres:postgres@localhost:54322/vhash"
echo ""
echo "To stop: docker stop vhash-db-dev"
echo "To reset: docker rm -f vhash-db-dev && docker volume rm mini-app_vhash_dev_data"
