# Quick Start Guide - Edit and Reprompt Feature

## ✅ What Was Fixed

The edit and reprompt functionality now works end-to-end:
- ✅ Removed accidental conversation text from `flask_app.py`
- ✅ Fixed port mismatch (now using port 5000 consistently)
- ✅ Connected frontend to Flask backend for real image generation
- ✅ Added error handling with graceful fallbacks

## 🚀 How to Run

### 1. Set Environment Variables

```bash
export BFL_API_KEY=your_bfl_api_key_here
export GEMINI_API_KEY=your_gemini_key_here
export GOOGLE_API_KEY=your_google_key_here
```

### 2. Start Flask Backend

```bash
cd my-app/backend
python flask_app.py
```

Expected output:
```
 * Running on http://0.0.0.0:5000
```

### 3. Start Next.js Frontend (in another terminal)

```bash
cd my-app
npm run dev
```

Expected output:
```
- Local: http://localhost:3000
```

### 4. Test the Feature

1. Navigate to: `http://localhost:3000/protected/brain/[some-case-id]`
2. Scroll to "Edit and Reprompt" section
3. Enter additional prompt text (e.g., "with enhanced contrast showing tumor progression")
4. Select timepoints to regenerate (e.g., check "Now" and "3M")
5. Click "Reprompt Selected"
6. Wait 30-60 seconds per timepoint for images to generate

## 🧪 Testing

### Quick Backend Test

```bash
cd my-app/backend
python test_reprompt.py
```

This will:
- Check if Flask server is running
- Test the `/model/generate_images` endpoint
- Generate sample images for 2 timepoints
- Report success/failure

### Manual API Test

```bash
curl -X POST http://localhost:5000/model/generate_images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Detailed CT scan of human brain",
    "timepoints": ["now"]
  }'
```

Expected response:
```json
{
  "images": {
    "now": "https://..."
  }
}
```

## 📁 Files Changed

| File | Changes |
|------|---------|
| `backend/flask_app.py` | Removed conversation text, fixed port to 5000 |
| `lib/brain/db.ts` | Added backend integration for real image generation |
| `lib/brain/generator.ts` | Cleaned up BACKEND_URL |
| `lib/brain/video.ts` | Cleaned up BACKEND_URL |
| `lib/brain/model.ts` | Cleaned up BACKEND_URL |

## 🔍 Troubleshooting

### "Connection refused" error
- Make sure Flask backend is running on port 5000
- Check: `curl http://localhost:5000`

### "Missing BFL_API_KEY" error
- Set the environment variable: `export BFL_API_KEY=your_key`
- Restart the Flask server after setting

### Images not generating
- Check Flask logs for errors
- Verify BFL API key is valid
- Check network connectivity
- Try the test script: `python test_reprompt.py`

### Placeholder images instead of real ones
- This is expected if backend is unavailable (graceful fallback)
- Check Flask server is running
- Check console for error messages

## 📊 Expected Behavior

### Success Case:
1. User clicks "Reprompt Selected"
2. Button shows "Working..."
3. After 30-60s per timepoint, new images appear
4. Images are stored in Supabase
5. Button returns to "Reprompt Selected"

### Fallback Case (Backend Down):
1. User clicks "Reprompt Selected"
2. Button shows "Working..."
3. Placeholder images are used
4. Error logged to console
5. User can still interact with the app

## 🎯 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/model/prompt` | POST | Generate enhanced prompt from EHR/CT data |
| `/model/generate_images` | POST | Generate brain images for timepoints |
| `/model/generate_video` | POST | Generate video from brain images |

## 📖 More Documentation

- **Detailed Flow**: See `REPROMPT_FLOW.md`
- **All Changes**: See `../CHANGES_SUMMARY.md`
- **API Spec**: See `api_spec.yaml`

## ⚡ Performance Notes

- Each timepoint takes ~30-60 seconds to generate
- 4 timepoints = 2-4 minutes total
- Consider generating fewer timepoints for faster results
- Images are cached in Supabase (no regeneration on page reload)

