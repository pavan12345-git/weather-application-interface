#!/bin/bash
set -e
python -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
echo "You can optionally create a superuser now. Press Ctrl+C to skip."
python manage.py createsuperuser || true
echo "Setup complete! Run ./start.sh to start server"

