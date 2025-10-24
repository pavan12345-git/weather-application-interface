#!/bin/bash

# Complete Render Deployment Script
# This script helps prepare and deploy the weather application to Render

echo "🚀 Weather App - Complete Render Deployment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Preparing for deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

echo "🎉 Preparation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://render.com and sign in with GitHub"
echo "2. Deploy Backend Service:"
echo "   - Click \"New\" → \"Web Service\""
echo "   - Connect your GitHub repository"
echo "   - Set Root Directory to \"backend\""
echo "   - Set Environment to \"Python 3\""
echo "   - Set Build Command: pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput"
echo "   - Set Start Command: gunicorn weather_app.wsgi:application --bind 0.0.0.0:\$PORT"
echo "   - Set Environment Variables:"
echo "     * SECRET_KEY=your-secret-key-here"
echo "     * DEBUG=False"
echo "     * ALLOWED_HOSTS=weather-backend.onrender.com"
echo "     * OPENWEATHER_API_KEY=your-openweather-api-key"
echo "     * CORS_ALLOWED_ORIGINS=https://weather-frontend.onrender.com"
echo "     * DATABASE_URL=sqlite:///db.sqlite3"
echo "3. Deploy Frontend Service:"
echo "   - Click \"New\" → \"Web Service\""
echo "   - Connect your GitHub repository"
echo "   - Set Root Directory to \"./\""
echo "   - Set Environment to \"Node\""
echo "   - Set Build Command: npm install && npm run build"
echo "   - Set Start Command: npm start"
echo "   - Set Environment Variables:"
echo "     * NEXT_PUBLIC_API_URL=https://weather-backend.onrender.com/api"
echo ""
echo "🔗 Render Dashboard: https://render.com/dashboard"
echo "📖 Deployment Guide: RENDER_DEPLOYMENT_GUIDE.md"
