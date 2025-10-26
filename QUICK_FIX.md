# 🚨 Quick Fix: Homepage Not Loading Movies

## 3-Minute Fix

### Step 1: Create Frontend Environment File

Create file: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 2: Check Backend is Running

```bash
# In backend folder
npm run start:dev
```

Look for: `Application is running on: http://localhost:3001`

### Step 3: Check Frontend is Running

```bash
# In frontend folder (different terminal)
npm run dev
```

### Step 4: Test Backend Directly

Open in browser: `http://localhost:3001/movies/trending`

**If you see JSON data:** Backend is working ✅  
**If you see error:** Check backend logs

### Step 5: Restart Frontend

After creating `.env.local`, restart the frontend server:
```bash
# Press Ctrl+C to stop, then:
npm run dev
```

## That's It! 

The homepage should now load movies.

---

## If Still Not Working

1. Check browser console (F12) for errors
2. Check backend terminal for errors
3. Check if Redis is running (see SETUP_GUIDE.md)

