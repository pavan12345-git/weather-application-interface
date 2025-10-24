@echo off
echo Starting Django backend...
if exist venv\Scripts\activate (
  call venv\Scripts\activate
) else (
  echo Virtualenv 'venv' not found. Run setup.sh first.
  exit /b 1
)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

