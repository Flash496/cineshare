# CINESHARE Setup Guide

## Issues Found & Solutions

### 🔴 **Problem 1: Homepage Not Showing Movies**
**Root Cause:** The frontend was trying to call non-existent Next.js API routes (`/api/movies/trending`)

**Solution:** ✅ Created Next.js API route handlers that proxy requests to the backend
- Created: `frontend/app/api/movies/[endpoint]/route.ts`
- Created: `frontend/app/api/movies/search/route.ts`

### 🔴 **Problem 2: Redis Testing Not Working**
**Root Cause:** Missing environment variables and possibly Redis not running

**Solution:** Configure environment variables (see steps below)

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Setup Environment Variables

#### Backend Environment (create `backend/.env`)

Create a file `backend/.env` with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cineshare"

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# TMDB API Key (get yours from https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL (for CORS and OAuth callbacks)
FRONTEND_URL=http://localhost:3000

# Redis Configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB (if using MongoDB for movie caching)
MONGODB_URI=mongodb://localhost:27017/cineshare

# Server Port
PORT=3001
```

#### Frontend Environment (create `frontend/.env.local`)

Create a file `frontend/.env.local` with the following content:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Setup PostgreSQL Database

1. **Install PostgreSQL** if not already installed
2. **Create a database:**
   ```sql
   CREATE DATABASE cineshare;
   ```

3. **Update the DATABASE_URL** in `backend/.env` with your actual PostgreSQL credentials

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

### Step 4: Setup Redis

**Option A: Install Redis Locally**

Windows:
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL: `wsl redis-server`

macOS:
```bash
brew install redis
brew services start redis
```

Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Option B: Use Docker**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 5: Get TMDB API Key

1. Go to: https://www.themoviedb.org/
2. Create an account
3. Go to Settings → API
4. Request an API key
5. Copy the API key and add it to `backend/.env`

### Step 6: Start the Backend Server

```bash
cd backend
npm run start:dev
```

**Expected output:**
```
[Nest] Info TMDB API Key loaded: abcd1234...
Application is running on: http://localhost:3001
```

**If you see Redis errors:**
- Make sure Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env`

### Step 7: Start the Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

### Step 8: Test the Application

1. Open browser: http://localhost:3000
2. You should see:
   - "Welcome to CineShare" homepage
   - Two movie carousels: "Trending This Week" and "Popular Movies"
   - Movie posters should be loading

---

## Troubleshooting

### Issue: "Cannot connect to Redis"
**Solution:** 
- Make sure Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `backend/.env`
- If still failing, comment out the CacheModule temporarily

### Issue: "TMDB_API_KEY is not defined"
**Solution:**
- Add your TMDB API key to `backend/.env`
- Restart the backend server

### Issue: "Database connection failed"
**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL in `backend/.env`
- Run: `npx prisma migrate dev`

### Issue: Homepage shows "Loading..." forever
**Solution:**
- Check browser console for errors
- Check if backend is running on port 3001
- Check if `NEXT_PUBLIC_API_URL` is set in `frontend/.env.local`
- Check browser Network tab to see if API calls are failing

### Issue: "404 Not Found" for API routes
**Solution:**
- Make sure the Next.js API routes were created:
  - `frontend/app/api/movies/[endpoint]/route.ts`
  - `frontend/app/api/movies/search/route.ts`
- Restart the frontend dev server

---

## Testing Redis

### Backend Redis Test

Add a test endpoint to verify Redis is working:

```typescript
// backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Controller()
export class AppController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('test-cache')
  async testCache() {
    await this.cacheService.set('test', 'Hello Redis!', 60);
    const value = await this.cacheService.get('test');
    return { message: 'Cache test', value };
  }
}
```

Then test:
```bash
curl http://localhost:3001/test-cache
```

**Expected response:**
```json
{
  "message": "Cache test",
  "value": "Hello Redis!"
}
```

---

## Summary of Changes Made

1. ✅ Created Next.js API route handlers for movie endpoints
2. ✅ Configured proper proxy from frontend to backend
3. ✅ Added environment variable documentation
4. ✅ Created this setup guide

---

## Next Steps

1. Complete the missing modules (Reviews, Watchlist, Users, Feed)
2. Fix linting errors: `cd backend && npm run lint -- --fix`
3. Add proper error handling and loading states
4. Implement user authentication features
5. Add user reviews and watchlist functionality

