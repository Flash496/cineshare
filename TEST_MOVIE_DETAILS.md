# 🎬 Test Movie Details Page

## Quick Test Steps

1. **Make sure both servers are running:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run start:dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

2. **Navigate to homepage:** http://localhost:3000

3. **Click on any movie** from the carousel

4. **Verify the following displays:**

### ✅ Page Loads
- URL changes to `/movies/[id]`
- Page shows movie details
- No errors in browser console

### ✅ Visual Elements
- Backdrop image at top
- Poster on left side
- Movie title large and bold
- Original title shows (if different)
- Release year, runtime, rating visible
- Genre badges displayed

### ✅ Content
- Overview/description text
- Director name (if available)
- Cast section with photos
- Similar movies sidebar

### ✅ Buttons Work
- "Watch Trailer" button opens YouTube modal
- "Add to Watchlist" button visible
- Heart icon visible

### ✅ Sections Load
- Cast section shows actor photos and names
- Similar movies section shows related films
- Reviews section loads (may be empty)
- "Read more" expands long reviews

### ✅ Navigation
- Clicking similar movie navigates to that movie
- Browser back button works
- Can navigate between movies

## Expected Behavior

### First Load
- Fast initial render
- Images load progressively
- Smooth transitions

### Interactions
- Watch Trailer → YouTube video in modal
- Expand review → Shows full text
- Click similar movie → Navigate to that page

### Edge Cases
- Movie with no trailer → Button doesn't show
- No similar movies → Shows "None found"
- No reviews → Shows "No reviews yet" message

## Troubleshooting

### ❌ "Cannot find movie"
- Check backend logs
- Verify movie ID is valid
- Check if backend is running

### ❌ Images not loading
- Check TMDB image domains in next.config.ts
- Verify `image.tmdb.org` is allowed
- Check browser console for CORS errors

### ❌ Reviews not showing
- Check backend `/movies/:id/reviews` endpoint
- May be empty if movie has no TMDB reviews
- Check console for API errors

### ❌ Similar movies not loading
- Check backend `/movies/:id/similar` endpoint
- Verify similar movies exist for this movie
- Check network tab in dev tools

## Success Criteria

✅ Clicking movie card navigates to details page  
✅ All visual elements display  
✅ Buttons are functional  
✅ All sections load data  
✅ Navigation works smoothly  
✅ Error handling works  

If all above pass → Movie details page is working perfectly! 🎉

