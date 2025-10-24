# Weather application interface

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pavansimhadriedu-gmailcoms-projects/v0-weather-application-interface)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/SEvzlUxBfmA)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/pavansimhadriedu-gmailcoms-projects/v0-weather-application-interface](https://vercel.com/pavansimhadriedu-gmailcoms-projects/v0-weather-application-interface)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/SEvzlUxBfmA](https://v0.app/chat/projects/SEvzlUxBfmA)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

---

## Backend (Django REST API)

The repo includes a Django backend under `backend/` for weather data.

### Setup
1. Create a virtualenv and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Create `backend/.env` with your settings (see example below). Set `OPENWEATHER_API_KEY`.
3. Apply migrations:
   ```bash
   python manage.py migrate
   ```
4. Run the server:
   ```bash
   python manage.py runserver 8000
   ```

`.env` example:
```
DATABASE_URL=sqlite:///db.sqlite3
OPENWEATHER_API_KEY=your_actual_api_key_here
SECRET_KEY=generate-using-django-secret-key-generator
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend to Backend
Create `.env.local` in repo root:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=WeatherHub
```

Run both:
- Backend: `cd backend && python manage.py runserver 8000`
- Frontend: `pnpm dev` (or `npm run dev`) and visit `http://localhost:3000`

---

## Development Workflow

### First Time Setup:

Backend:
1. cd backend
2. ./setup.sh (or setup.bat on Windows)
3. Add OPENWEATHER_API_KEY to .env
4. python manage.py runserver

Frontend:
1. npm install (in root directory)
2. Create .env.local with NEXT_PUBLIC_API_URL
3. npm run dev

### Daily Development:

Terminal 1 (Backend):
```
cd backend
source venv/bin/activate
python manage.py runserver
```

Terminal 2 (Frontend):
```
npm run dev
```

### Testing:

Backend:
```
cd backend
python manage.py test
python manage.py test_api
```

Frontend:
```
npm run test
```

### Useful Commands:

Backend:
- `python manage.py shell` (Django shell)
- `python manage.py dbshell` (Database shell)
- `python manage.py cleanup_cache` (Clear old cache)
- `python manage.py seed_data` (Create test data)

Admin Panel: `http://localhost:8000/admin/`

### Troubleshooting:

- CORS errors: Check `CORS_ALLOWED_ORIGINS` in `backend/.env`
- API not responding: Ensure backend server is running
- Database errors: Run `python manage.py migrate`