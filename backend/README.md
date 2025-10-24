# Backend (Django REST API)

## Prerequisites
- Python 3.10+
- pip / virtualenv (recommended)

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create `.env` with your settings (see example below). At minimum set `OPENWEATHER_API_KEY`.
3. Apply migrations:
   ```bash
   python manage.py migrate
   ```
4. (Optional) Create an admin user:
   ```bash
   python manage.py createsuperuser
   ```
5. Run the development server:
   ```bash
   python manage.py runserver 8000
   ```

## .env example
```env
DATABASE_URL=sqlite:///db.sqlite3
OPENWEATHER_API_KEY=your_actual_api_key_here
SECRET_KEY=generate-using-django-secret-key-generator
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Useful commands
- Cleanup old cache:
  ```bash
  python manage.py cleanup_cache
  ```
- Test API connectivity:
  ```bash
  python manage.py test_api --lat=51.5074 --lon=-0.1278 --query=London
  ```
- Seed sample data:
  ```bash
  python manage.py seed_data --locations=5
  ```

## API base URL
Default: `http://localhost:8000/api`

Key endpoints:
- `GET /api/health/`
- `GET /api/weather/current/?lat=..&lon=..`
- `GET /api/weather/forecast/?lat=..&lon=..&days=7`
- `GET /api/locations/search/?q=..`
- `POST /api/locations/save/`
- `GET /api/locations/?session_id=...`
- `DELETE /api/locations/{id}/?session_id=...`
- `POST /api/locations/{id}/favorite/`
- `GET /api/preferences/?session_id=...`
- `POST /api/preferences/update/`
