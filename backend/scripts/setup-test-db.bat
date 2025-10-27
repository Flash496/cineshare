@echo off
REM Script to set up test databases for CineShare (Windows)
REM Save as: scripts/setup-test-db.bat

echo.
echo 🧪 Setting up CineShare test databases...
echo.

REM PostgreSQL Test Database
echo 📦 Creating PostgreSQL test database...
echo.

set PGPASSWORD=811909

REM Drop and create database
psql -U postgres -h localhost -p 5432 -c "DROP DATABASE IF EXISTS cineshare_test;" 2>nul
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE cineshare_test;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL test database created successfully
) else (
    echo ❌ Failed to create PostgreSQL test database
    echo Make sure PostgreSQL is installed and running
    echo Run: pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"
    pause
    exit /b 1
)

echo.

REM MongoDB Test Database
echo 📦 Setting up MongoDB test database...
mongosh --eval "use cineshare_test; db.createCollection('test_collection'); db.test_collection.drop();" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB test database ready
) else (
    echo ⚠️  MongoDB might not be running or mongosh not installed
    echo You can skip this if you're not using MongoDB
)

echo.

REM Redis - verify connection
echo 📦 Verifying Redis connection...
redis-cli ping >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Redis is running
    redis-cli -n 1 FLUSHDB >nul 2>&1
    echo ✅ Redis test database DB 1 has been cleared
) else (
    echo ⚠️  Redis might not be running
    echo You can skip this if you're not using Redis
)

echo.
echo ✅ Test environment setup complete!
echo.
echo 📝 Next steps:
echo    1. Make sure .env.test file exists in your backend folder
echo    2. Run: npm run test:e2e
echo.
pause