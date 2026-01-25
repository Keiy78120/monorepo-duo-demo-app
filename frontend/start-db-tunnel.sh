#!/bin/bash
# SSH tunnel to VPS PostgreSQL
# This forwards local port 5433 to the PostgreSQL container on the VPS

echo "🔒 Creating SSH tunnel to VPS PostgreSQL..."
echo "Local: localhost:5433 → VPS: 109.176.197.27:5432"
echo ""
echo "Keep this terminal open while developing."
echo "Press Ctrl+C to close the tunnel."
echo ""

ssh -N -L 5433:localhost:5432 root@109.176.197.27
