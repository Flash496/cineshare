# Debug Guide: Homepage Not Loading Movies

## Issues Fixed ✅

1. **Next.js 15+ params handling** - Added `await` for params
2. **Added debug logging** - Console logs to track API calls
3. **Better error messages** - Shows backend URL and error details

## What to Check Now

### 1. Backend Server Running?

Open a terminal and run:
```bash
cd backend
npm run start:dev
```

**Look for:**
- ✅ "Application is running on: http://localhost:3001"
- ✅ "TMDB API Key loaded: ..."
- ❌ Any Redis connection errors

### 2. Frontend Server Running?

Open another terminal and run:
```bash
cd frontend
npm run dev
```

**Look for:**
- ✅ "ready started server on 0.0.0.0:3000"

### 3. Environment Variables Set?

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TMDB_API_KEY=your_tmdb_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Test Backend Directly

Open browser and test:
```
http://localhost:3001/movies/trending
http://localhost:3001/movies/popular
```

**Expected:** JSON response with movie data
**If fails:** Check backend logs

### 5. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab:** Look for error messages
- **Network tab:** Check if requests to `/api/movies/trending` are failing

### 6. Check Next.js Server Logs

In the terminal running `npm run dev`, look for:
```
[API Route] Fetching from: http://localhost:3001/movies/trending
[API Route] Response status: 200
[API Route] Successfully fetched data
```

## Common Issues & Solutions

### Issue: "Cannot GET /movies/trending"
**Cause:** Backend not running  
**Fix:** Start backend with `npm run start:dev` in the backend folder

### Issue: "ECONNREFUSED localhost:3001"
**Cause:** Backend not running or wrong port  
**Fix:** Check backend is running on port 3001

### Issue: "TMDB_API_KEY is not defined"
**Cause:** Missing TMDB API key  
**Fix:** Get API key from https://www.themoviedb.org/ and add to `backend/.env`

### Issue: Homepage shows loading forever
**Cause:** Backend down or API calls failing  
**Fix:** Check browser console and network tab

### Issue: Redis Connection Error
**Cause:** Redis not running  
**Fix:** Either:
1. Start Redis server, OR
2. Comment out CacheModule temporarily in `app.module.ts`

## Quick Test Commands

```bash
# Test if backend is responding
curl http://localhost:3001/movies/trending

# Test if Redis is running
redis-cli ping

# Check if frontend can reach backend
curl http://localhost:3000/api/movies/trending
```

## Expected Behavior

1. Backend starts: ✅ Runs on port 3001
2. Frontend starts: ✅ Runs on port 3000
3. Visit homepage: ✅ Shows "Trending This Week" and "Popular Movies"
4. Movie carousels: ✅ Display movie posters
5. Search bar: ✅ Shows search results when typing

If all above work → Problem is solved! 🎉
