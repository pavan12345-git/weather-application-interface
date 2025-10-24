#!/bin/bash

printf "\n🔍 Verifying Weather App Setup\n"

# Backend
printf "\n📦 Backend Checks:\n"
cd backend 2>/dev/null || { echo "❌ Could not cd into backend"; exit 1; }

if [ -f "manage.py" ]; then
  echo "✅ manage.py exists"
else
  echo "❌ manage.py missing"
fi

if [ -f ".env" ]; then
  echo "✅ .env file exists"
else
  echo "❌ .env file missing"
fi

# Check if server responds (any HTTP status considered OK for availability)
curl -s http://localhost:8000/api/locations/ > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Backend API responding"
else
  echo "❌ Backend not running"
fi

# Frontend
printf "\n🎨 Frontend Checks:\n"
cd .. || exit 1

if [ -f "package.json" ]; then
  echo "✅ package.json exists"
else
  echo "❌ package.json missing"
fi

if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
else
  echo "❌ .env.local missing"
fi

curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Frontend responding"
else
  echo "❌ Frontend not running"
fi

printf "\n🧪 Running Tests:\n"
cd backend || exit 1
python manage.py test --verbosity=0
if [ $? -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Some tests failed"
fi

printf "\n✨ Verification complete!\n"


