import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / '.env'
load_dotenv(ENV_PATH)  # load backend/.env

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]
# In development, allow all hosts to support accessing via LAN IPs
if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Local apps
    'core',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'weather_app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'weather_app.wsgi.application'
ASGI_APPLICATION = 'weather_app.asgi.application'

# Database: use sqlite by default; parse DATABASE_URL for extensibility
# Supports simple 'sqlite:///db.sqlite3'
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3')
DB_PATH = DATABASE_URL.replace('sqlite:///', '')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(BASE_DIR / DB_PATH),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = str(BASE_DIR / 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOW_CREDENTIALS = True
# Provide sensible defaults for local dev if env not set
_cors_env = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if _cors_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
else:
    # Default Next.js dev server origins
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
    ]

# In development, allow all origins for easier local testing across devices
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Cookies / CSRF
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Set True in production when using HTTPS
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# DRF configuration with JSON renderer default
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# External API keys
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')


