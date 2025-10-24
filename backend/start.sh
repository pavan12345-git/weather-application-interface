#!/bin/bash
echo "Starting Django backend..."
if [ -d "venv" ]; then
  # shellcheck disable=SC1091
  source venv/bin/activate
else
  echo "Virtualenv 'venv' not found. Run ./setup.sh first."
  exit 1
fi
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

