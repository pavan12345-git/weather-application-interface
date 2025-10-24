#!/bin/bash
set -e
echo "Running Django tests..."
python manage.py test --verbosity=2

echo "Running API tests with curl..."
echo "Health check:"
curl -sSf -X GET http://localhost:8000/api/health/ || true
echo
echo "Current weather (London):"
curl -s -X GET "http://localhost:8000/api/weather/current/?lat=51.5074&lon=-0.1278" || true
echo
echo "Forecast (London):"
curl -s -X GET "http://localhost:8000/api/weather/forecast/?lat=51.5074&lon=-0.1278&days=3" || true
echo

