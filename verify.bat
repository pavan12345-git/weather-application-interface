@echo off
echo.
echo 🔍 Verifying Weather App Setup

echo.
echo 📦 Backend Checks:
pushd backend 2>nul
if errorlevel 1 (
  echo ❌ Could not cd into backend
  exit /b 1
)

if exist manage.py (
  echo ✅ manage.py exists
) else (
  echo ❌ manage.py missing
)

if exist .env (
  echo ✅ .env file exists
) else (
  echo ❌ .env file missing
)

curl -s http://localhost:8000/api/locations/ > nul 2>&1
if %ERRORLEVEL%==0 (
  echo ✅ Backend API responding
) else (
  echo ❌ Backend not running
)

echo.
echo 🎨 Frontend Checks:
popd

if exist package.json (
  echo ✅ package.json exists
) else (
  echo ❌ package.json missing
)

if exist .env.local (
  echo ✅ .env.local exists
) else (
  echo ❌ .env.local missing
)

curl -s http://localhost:3000 > nul 2>&1
if %ERRORLEVEL%==0 (
  echo ✅ Frontend responding
) else (
  echo ❌ Frontend not running
)

echo.
echo 🧪 Running Tests:
pushd backend
python manage.py test --verbosity=0 > nul 2>&1
if %ERRORLEVEL%==0 (
  echo ✅ All tests passed
) else (
  echo ❌ Some tests failed
)
popd

echo.
echo ✨ Verification complete!


