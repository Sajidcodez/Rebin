# ✅ Complete Render Deployment Checklist

## 📋 What You Need to Deploy

1. **YOLO Service** → `https://rebin-yolo.onrender.com`
2. **Backend Service** → `https://rebin-backend.onrender.com`
3. **Frontend (Local)** → Teammates run with `.env` pointing to backend

---

## 🔧 Step 1: Push Latest Code

Your YOLO service needs the PyTorch fix. Let's push it:

```bash
cd /Users/sohilol/rebin/Rebin
git add .
git commit -m "Fix: Add all YOLOv11 safe globals for Render deployment"
git push origin sohi
```

Then on Render → YOLO service → **"Manual Deploy"** → **"Deploy latest commit"**

---

## ⚙️ Step 2: YOLO Service Settings

**Already deployed at:** `https://rebin-yolo.onrender.com`

### Verify these settings:
- **Name:** `rebin-yolo`
- **Root Directory:** `services/yolov8-local`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Instance:** Free

### Test it:
Visit: `https://rebin-yolo.onrender.com/health`

Should see:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

---

## ⚙️ Step 3: Backend Service Settings

**Deploy/Update backend on Render**

### Settings:
- **Name:** `rebin-backend`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Instance:** Free

### Environment Variables (CRITICAL!):

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
YOLO_INFER_URL=https://rebin-yolo.onrender.com/predict

# Optional (with defaults)
OPENROUTER_MODEL=google/gemini-flash-1.5
FRONTEND_ORIGIN=http://localhost:5173

# Supabase (optional - will skip if missing)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
```

**⚠️ IMPORTANT:** Replace `https://rebin-yolo.onrender.com/predict` with YOUR actual YOLO URL!

### Test it:
Visit: `https://rebin-backend.onrender.com/docs`

Should see FastAPI Swagger UI ✅

---

## ⚙️ Step 4: Frontend Configuration

### For teammates:

Create `frontend/.env`:

```bash
VITE_API_BASE_URL=https://rebin-backend.onrender.com
```

**⚠️ Replace with YOUR actual backend URL!**

### Run:
```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## 🧪 Step 5: End-to-End Test

### Test the full flow:

1. **Frontend** → Open `http://localhost:5173`
2. **Click "Start Scanning"** → Allow camera
3. **Hold up an item** (water bottle, apple, etc.)
4. **Wait ~5 seconds** → Should see detection on right panel
5. **Click detected item** → Confirm it (checkmark appears)
6. **Click "Stop Scanning"** → Confirmed items remain
7. **Click "Analyze with AI"** → Fullscreen loading
8. **See results** → Gemini response with disposal instructions

---

## 🐛 Troubleshooting

### Issue: YOLO service shows `model_loaded: false`

**Check logs on Render:**
```
ERROR:app:Model file corrupted or incompatible
```

**Fix:**
1. Make sure you pushed the latest code (Step 1)
2. On Render → YOLO service → **"Manual Deploy"** → **"Clear build cache & deploy"**

---

### Issue: Backend 502 Bad Gateway

**Check environment variables:**
1. Go to backend service → "Environment" tab
2. Verify `OPENROUTER_API_KEY` is set
3. Verify `YOLO_INFER_URL` is correct and includes `/predict`

**Correct:** `https://rebin-yolo.onrender.com/predict`
**Wrong:** `https://rebin-yolo.onrender.com`

---

### Issue: Frontend can't reach backend

**Check `frontend/.env`:**
```bash
VITE_API_BASE_URL=https://rebin-backend.onrender.com
```

No trailing slash!

**Restart frontend:**
```bash
cd frontend
npm run dev
```

---

### Issue: "Rate limit" errors from Gemini

**This is expected** - free tier Gemini is rate-limited.

**We already disabled automatic refinement.**

If you want to re-enable hybrid detection:
1. Get your own Google API key
2. Add to OpenRouter integrations
3. Set `ENABLE_REFINEMENT = True` in `backend/routes/infer.py`

---

## 📊 Current Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Teammate's Laptop)       │
│  http://localhost:5173              │
│  VITE_API_BASE_URL=backend-url      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Backend (Render Free)              │
│  https://rebin-backend.onrender.com │
│  YOLO_INFER_URL=yolo-url/predict    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  YOLOv11 Service (Render Free)      │
│  https://rebin-yolo.onrender.com    │
│  /health, /predict                  │
└─────────────────────────────────────┘
```

---

## ✅ Final Checklist

- [ ] Pushed latest code with PyTorch fix
- [ ] YOLO deployed and healthy (`/health` returns `model_loaded: true`)
- [ ] Backend deployed with correct env vars
- [ ] Backend `/docs` page loads
- [ ] Frontend `.env` has correct backend URL
- [ ] Frontend runs and connects to backend
- [ ] End-to-end test: Webcam → Detection → Analysis works

---

## 🎯 Quick Reference URLs

**Your Services:**

```bash
# YOLO Service
https://rebin-yolo.onrender.com
https://rebin-yolo.onrender.com/health
https://rebin-yolo.onrender.com/predict

# Backend Service
https://rebin-backend.onrender.com
https://rebin-backend.onrender.com/docs

# Frontend (Local)
http://localhost:5173
```

**Update these with YOUR actual URLs!**

---

## 🎉 You're Done!

Once all checkboxes are ✅, you have a fully deployed, $0 cost hackathon app! 🚀

**No more ngrok. No more laptop dependency. Just deploy and demo!** 💚

