@echo off
REM Script to run Prisma migrations on test database
REM Save as: scripts/migrate-test-db.bat

echo.
echo 📊 Running Prisma migrations on test database...
echo.

REM Set environment to test
set NODE_ENV=test

REM Check if DATABASE_URL is set for test
echo 🔍 Checking test database connection...
set DATABASE_URL=postgresql://postgres:811909@localhost:5432/cineshare_test

REM Generate Prisma Client
echo 📦 Generating Prisma Client...
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate Prisma Client
    pause
    exit /b 1
)

echo ✅ Prisma Client generated

echo.
echo 🔄 Pushing schema to test database...
call npx prisma db push --skip-generate

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to push schema to test database
    echo.
    echo 💡 Make sure:
    echo    1. PostgreSQL is running
    echo    2. Database cineshare_test exists
    echo    3. Password is correct in DATABASE_URL
    pause
    exit /b 1
)

echo.
echo ✅ Database schema created successfully!
echo.
echo 📝 To verify, run: npx prisma studio --schema prisma/schema.prisma
echo.
pause