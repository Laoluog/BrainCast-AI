# Edit and Reprompt Functionality - End-to-End Flow

## Overview
The edit and reprompt feature allows users to modify the prompt and regenerate brain images for selected timepoints.

## Fixed Issues

### 1. **Removed Conversation Text from flask_app.py (Line 35)**
   - **Problem**: A large block of conversation text was accidentally pasted into the code
   - **Fix**: Removed the entire conversation block
   - **Impact**: Code now compiles and runs properly

### 2. **Fixed Port Mismatch**
   - **Problem**: Flask app was running on port 5001, but frontend was calling port 5000
   - **Fix**: Changed Flask app to run on port 5000 in `flask_app.py`
   - **Files Changed**: 
     - `backend/flask_app.py` (line 419): Changed from `port=5001` to `port=5000`
     - `lib/brain/generator.ts` (line 5): Cleaned up URL (removed trailing slash)

### 3. **Connected Frontend to Backend**
   - **Problem**: `generateImagesSupabase()` was using placeholder images instead of calling the Flask backend
   - **Fix**: Updated the function to call `requestGeneratedImages()` which hits the Flask `/model/generate_images` endpoint
   - **Files Changed**: `lib/brain/db.ts`

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                             │
│    - User views case at /protected/brain/[caseId]              │
│    - Enters edit text in "Edit and Reprompt" section           │
│    - Selects timepoints (now, 3m, 6m, 12m)                     │
│    - Clicks "Reprompt Selected" button                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (page.tsx)                                          │
│    - onReprompt() handler triggered                             │
│    - Calls generateImagesSupabase() with:                       │
│      • caseId                                                   │
│      • additionalPrompt (user's edit text)                      │
│      • timepoints (selected checkboxes)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DATABASE LAYER (db.ts)                                       │
│    - generateImagesSupabase() function:                         │
│      a. Fetches current case from Supabase                      │
│      b. Builds full prompt:                                     │
│         fullPrompt = generatedPrompt + additionalPrompt         │
│      c. Calls requestGeneratedImages() to Flask backend         │
│      d. Updates Supabase with new image URLs                    │
│      e. Returns updated case data                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API CLIENT (generator.ts)                                    │
│    - requestGeneratedImages() function:                         │
│      • POST to http://127.0.0.1:5000/model/generate_images      │
│      • Payload: { prompt, timepoints }                          │
│      • Returns: { images: { now: url, 3m: url, ... } }         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. FLASK BACKEND (flask_app.py)                                 │
│    - /model/generate_images endpoint:                           │
│      a. Receives prompt and timepoints                          │
│      b. For each timepoint:                                     │
│         • Appends timepoint-specific suffix                     │
│         • Calls BFL API (flux-kontext-pro)                      │
│         • Polls for completion                                  │
│         • Collects image URL                                    │
│      c. Returns { images: { tp: url, ... } }                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. EXTERNAL API (BFL)                                           │
│    - Flux Kontext Pro model generates brain images             │
│    - Returns URLs to generated images                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. DATA PERSISTENCE                                             │
│    - Image URLs stored in Supabase cases table                  │
│    - Frontend state updated with new images                     │
│    - User sees regenerated brain scans                          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

### Frontend
- **`app/protected/brain/[caseId]/page.tsx`** (lines 96-116)
  - `onReprompt()` handler that triggers the flow
  - UI for edit text input and timepoint selection

- **`lib/brain/db.ts`** (lines 102-148)
  - `generateImagesSupabase()` - orchestrates the reprompt flow
  - Calls Flask backend and updates Supabase

- **`lib/brain/generator.ts`** (lines 7-27)
  - `requestGeneratedImages()` - HTTP client for Flask API
  - Sends prompt and timepoints, receives image URLs

### Backend
- **`backend/flask_app.py`** (lines 333-409)
  - `/model/generate_images` endpoint
  - Integrates with BFL API for image generation
  - Handles timepoint-specific prompt augmentation

## Environment Variables Required

```bash
# Flask Backend
export BFL_API_KEY=your_bfl_api_key_here
export GEMINI_API_KEY=your_gemini_key_here  # For prompt generation
export GOOGLE_API_KEY=your_google_key_here  # For video generation

# Frontend (if needed)
export NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Testing

### Manual Testing
1. Start the Flask backend:
   ```bash
   cd backend
   python flask_app.py
   ```

2. Start the Next.js frontend:
   ```bash
   cd ..
   npm run dev
   ```

3. Navigate to a case page: `/protected/brain/[caseId]`
4. Enter text in "Edit and Reprompt" section
5. Select timepoints
6. Click "Reprompt Selected"
7. Wait for images to generate (30-60 seconds per timepoint)

### Automated Testing
Run the test script:
```bash
cd backend
python test_reprompt.py
```

## Error Handling

The implementation includes graceful fallbacks:

1. **Backend Unavailable**: Falls back to placeholder images
2. **BFL API Error**: Returns null for failed timepoints
3. **Timeout**: 90-second timeout per image generation
4. **Network Error**: Caught and logged, placeholders used

## Future Improvements

1. **Streaming Updates**: Show images as they're generated (not all at once)
2. **Progress Indicator**: Show which timepoint is currently generating
3. **Retry Logic**: Automatically retry failed generations
4. **Caching**: Cache generated images to avoid regenerating identical prompts
5. **Batch Optimization**: Generate multiple timepoints in parallel

