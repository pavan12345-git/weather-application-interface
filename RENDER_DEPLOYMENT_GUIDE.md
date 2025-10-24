# 🚀 Complete Render Deployment Guide

This guide will help you deploy your complete weather application (frontend + backend) to Render.

## 📋 Overview

Your weather application will be deployed as two separate services on Render:
- **Backend**: Django API service
- **Frontend**: Next.js web service

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           Render Platform            │
│  ┌─────────────────┐               │
│  │   Frontend      │               │
│  │   (Next.js)     │◄──────────────┤
│  │   Render Web    │               │
│  └─────────────────┘               │
│  ┌─────────────────┐               │
│  │   Backend       │               │
│  │   (Django)      │               │
│  │   Render Web    │               │
│  └─────────────────┘               │
└─────────────────────────────────────┘
```

## 🚀 Quick Deployment

### Step 1: Prepare Your Code
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy Backend to Render

1. **Go to [render.com](https://render.com)**
2. **Sign in with GitHub**
3. **Click "New" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure Backend Service:**
   - **Name**: `weather-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn weather_app.wsgi:application --bind 0.0.0.0:$PORT`

6. **Set Environment Variables:**
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=weather-backend.onrender.com
   OPENWEATHER_API_KEY=your-openweather-api-key
   CORS_ALLOWED_ORIGINS=https://weather-frontend.onrender.com
   DATABASE_URL=sqlite:///db.sqlite3
   ```

7. **Deploy Backend**

### Step 3: Deploy Frontend to Render

1. **Click "New" → "Web Service"**
2. **Connect your GitHub repository**
3. **Configure Frontend Service:**
   - **Name**: `weather-frontend`
   - **Root Directory**: `./` (root of your project)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Set Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://weather-backend.onrender.com/api
   ```

5. **Deploy Frontend**

## 🔧 Configuration Files

### Backend Configuration (`backend/render.yaml`)
```yaml
services:
  - type: web
    name: weather-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
    startCommand: gunicorn weather_app.wsgi:application --bind 0.0.0.0:$PORT
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: False
      - key: ALLOWED_HOSTS
        value: weather-backend.onrender.com
      - key: OPENWEATHER_API_KEY
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        value: https://weather-frontend.onrender.com
      - key: DATABASE_URL
        value: sqlite:///db.sqlite3
```

### Frontend Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: weather-frontend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://weather-backend.onrender.com/api
```

## 📊 Environment Variables

### Backend Environment Variables
```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=weather-backend.onrender.com
OPENWEATHER_API_KEY=your-openweather-api-key
CORS_ALLOWED_ORIGINS=https://weather-frontend.onrender.com
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend Environment Variables
```
NEXT_PUBLIC_API_URL=https://weather-backend.onrender.com/api
```

## 🛠️ Deployment Scripts

### Automated Deployment Script
```bash
# Windows
deploy-render.bat

# Linux/Mac
./deploy-render.sh
```

## 🔧 Manual Deployment Steps

### 1. Backend Deployment
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `weather-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn weather_app.wsgi:application --bind 0.0.0.0:$PORT`
5. Set environment variables
6. Deploy

### 2. Frontend Deployment
1. Click "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `weather-frontend`
   - **Root Directory**: `./`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set environment variables
5. Deploy

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
- Check build logs in Render dashboard
- Verify all dependencies are in requirements.txt
- Check Python version compatibility

#### 2. CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check backend CORS configuration

#### 3. API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend logs for errors
- Ensure backend is accessible

#### 4. Database Issues
- Check if migrations are running
- Verify database configuration
- Check for SQLite file permissions

### Debugging Steps

1. **Check Backend Health**:
   ```bash
   curl https://weather-backend.onrender.com/api/health/
   ```

2. **Check Frontend API Connection**:
   - Open browser dev tools
   - Check Network tab for API calls
   - Verify API URL in environment variables

3. **Check Logs**:
   - Go to Render dashboard
   - Check service logs
   - Look for error messages

## 📊 Monitoring and Maintenance

### Performance Monitoring
- Use Render dashboard for service monitoring
- Check service health and performance
- Monitor resource usage

### Database Maintenance
- Regular backups for production data
- Consider database upgrades for scale
- Monitor database performance

### Security
- Keep dependencies updated
- Use environment variables for secrets
- Enable HTTPS (automatic on Render)
- Regular security audits

## 🚀 Production Optimizations

### Backend Optimizations
- Upgrade to PostgreSQL for production
- Implement proper logging
- Add rate limiting
- Use Redis for caching
- Set up monitoring and alerting

### Frontend Optimizations
- Enable Render analytics
- Implement proper error boundaries
- Add loading states and error handling
- Optimize bundle size

## 📝 Environment Variables Reference

### Backend (Render)
```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=weather-backend.onrender.com
OPENWEATHER_API_KEY=your-openweather-api-key
CORS_ALLOWED_ORIGINS=https://weather-frontend.onrender.com
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend (Render)
```
NEXT_PUBLIC_API_URL=https://weather-backend.onrender.com/api
```

## 🎯 Next Steps

1. **Deploy Backend**: Follow Step 2 above
2. **Deploy Frontend**: Follow Step 3 above
3. **Test Application**: Verify all features work
4. **Monitor**: Set up monitoring and logging
5. **Optimize**: Implement production optimizations

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Render documentation
3. Check service logs for errors
4. Verify environment variables are set correctly

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Django Deployment Guide](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [OpenWeather API](https://openweathermap.org/api)

---

**Note**: This guide assumes you have the necessary API keys and accounts set up. Make sure to replace placeholder URLs with your actual deployment URLs.
