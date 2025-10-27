@echo off
REM Script to clean test databases for CineShare (Windows)
REM Save as: scripts/cleanup-test-db.bat

echo.
echo 🧹 Cleaning CineShare test databases...
echo.

set PGPASSWORD=811909

REM PostgreSQL
echo 🗑️  Cleaning PostgreSQL test database...
psql -U postgres -h localhost -p 5432 -c "DROP DATABASE IF EXISTS cineshare_test;" 2>nul
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE cineshare_test;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL test database cleaned
) else (
    echo ❌ Failed to clean PostgreSQL test database
)

echo.

REM MongoDB
echo 🗑️  Cleaning MongoDB test database...
mongosh --eval "use cineshare_test; db.dropDatabase();" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB test database cleaned
) else (
    echo ⚠️  MongoDB cleanup skipped (might not be running)
)

echo.

REM Redis test database (DB 1)
echo 🗑️  Cleaning Redis test database...
redis-cli -n 1 FLUSHDB >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Redis test database DB 1 cleaned
) else (
    echo ⚠️  Redis cleanup skipped (might not be running)
)

echo.
echo ✅ Test databases cleaned successfully!
echo    You can now run: npm run test:e2e
echo.
pause