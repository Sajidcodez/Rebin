# 🚀 Complete Deployment Guide (Free Tier)

## 📋 What You're Deploying

1. **Backend (FastAPI)** → Render Free Tier
2. **YOLOv8 Service** → Render Free Tier
3. **Frontend (React)** → Run locally (teammates)

**Total Cost: $0** 🎉

---

## ⚙️ Step-by-Step Deployment

### **Part 1: Deploy YOLOv8 Service First**

#### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repo: `Rebin`

#### 2. Configure YOLOv8 Service

**Basic Settings:**
```
Name: rebin-yolo
Region: Oregon (US West) or closest to you
Branch: main (or sohi)
Root Directory: services/yolov8-local
Runtime: Python 3
```

**Build & Deploy:**
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Instance Type:**
```
Free
```

#### 3. Click "Create Web Service"

⏳ **Wait 10-15 minutes** for:
- Dependencies to install
- YOLOv11 model to download (~200MB)
- First build to complete

You'll get a URL like: `https://rebin-yolo-xyz.onrender.com`

#### 4. Test YOLO Service

Open in browser: `https://rebin-yolo-xyz.onrender.com/health`

Should see:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

✅ **YOLO service is live!**

---

### **Part 2: Deploy Backend**

#### 1. Create New Web Service

- Click **"New +"** → **"Web Service"**
- Select your repo again

#### 2. Configure Backend Service

**Basic Settings:**
```
Name: rebin-backend
Region: Same as YOLO service
Branch: main (or sohi)
Root Directory: backend
Runtime: Python 3
```

**Build & Deploy:**
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Instance Type:**
```
Free
```

#### 3. Add Environment Variables

Click **"Environment"** tab and add:

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxx...  # Your OpenRouter key
YOLO_INFER_URL=https://rebin-yolo-xyz.onrender.com/predict  # From Part 1!

# Optional (default values shown)
OPENROUTER_MODEL=google/gemini-flash-1.5
FRONTEND_ORIGIN=http://localhost:5173
```

**⚠️ Important:** Replace `rebin-yolo-xyz.onrender.com` with your actual YOLO URL from Part 1!

#### 4. Click "Create Web Service"

⏳ **Wait 3-5 minutes** for backend to deploy.

You'll get a URL like: `https://rebin-backend-abc.onrender.com`

#### 5. Test Backend

Open: `https://rebin-backend-abc.onrender.com/docs`

Should see the FastAPI Swagger UI! ✅

---

### **Part 3: Configure Frontend (Teammates)**

#### 1. Update Frontend `.env`

Each teammate creates `frontend/.env`:

```bash
VITE_API_BASE_URL=https://rebin-backend-abc.onrender.com
```

**⚠️ Replace with your actual backend URL from Part 2!**

#### 2. Install & Run

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

✅ **Frontend connected to deployed backend!**

---

## 🎯 Final Architecture

```
┌─────────────────────────┐
│  Frontend (Local)       │  ← Teammates run this
│  http://localhost:5173  │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────────────┐
│  Backend (Render Free)          │
│  https://rebin-backend-abc...   │  ← Always available
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│  YOLOv8 (Render Free)           │
│  https://rebin-yolo-xyz...      │  ← Always available
└─────────────────────────────────┘
```

---

## ✅ Verification Checklist

After deployment, verify each service:

### YOLOv8 Service ✓
- [ ] Health check returns `model_loaded: true`
- [ ] URL: `https://rebin-yolo-xyz.onrender.com/health`

### Backend Service ✓
- [ ] Swagger UI loads at `/docs`
- [ ] URL: `https://rebin-backend-abc.onrender.com/docs`
- [ ] Environment variables set (YOLO_INFER_URL, OPENROUTER_API_KEY)

### Frontend ✓
- [ ] `.env` has correct backend URL
- [ ] `npm run dev` starts successfully
- [ ] Can access at `http://localhost:5173`

### End-to-End Test ✓
- [ ] Webcam starts
- [ ] Detections appear on right panel
- [ ] Can confirm items
- [ ] "Analyze with AI" button works
- [ ] Gets results from Gemini

---

## 🐛 Common Issues & Fixes

### Issue 1: YOLO service shows `model_loaded: false`

**Cause:** Model download failed during build

**Fix:**
1. Go to YOLO service on Render
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for rebuild

---

### Issue 2: Backend can't reach YOLO

**Error:** `503 Service Unavailable` or `Name or service not known`

**Fix:**
1. Check YOLO service is deployed and healthy
2. Verify `YOLO_INFER_URL` in backend environment variables
3. Make sure URL includes `/predict` at the end
4. Correct: `https://rebin-yolo-xyz.onrender.com/predict`
5. Wrong: `https://rebin-yolo-xyz.onrender.com`

---

### Issue 3: Frontend can't reach backend

**Error:** `Network Error` or `CORS`

**Fix:**
1. Check `VITE_API_BASE_URL` in `frontend/.env`
2. Should be: `https://rebin-backend-abc.onrender.com` (no trailing slash)
3. Restart frontend: `npm run dev`

---

### Issue 4: First request is very slow

**Cause:** Free tier services sleep after 15 min of inactivity

**Fix (for demos):**
Keep services warm with a ping script:

```bash
# Run this 5 minutes before demo
while true; do 
  curl https://rebin-yolo-xyz.onrender.com/health
  curl https://rebin-backend-abc.onrender.com/docs
  sleep 600  # Every 10 minutes
done
```

---

### Issue 5: Rate limit errors from Gemini

**Error:** `429 Rate Limit` in logs

**Fix:**
We already disabled automatic refinement in the code. If you want to re-enable:
1. Get your own Google API key: https://ai.google.dev
2. Add to OpenRouter integrations: https://openrouter.ai/settings/integrations
3. Set `ENABLE_REFINEMENT = True` in `backend/routes/infer.py`

---

## 💰 Cost Breakdown

| Service | Tier | Cost/Month | Notes |
|---------|------|------------|-------|
| Backend | Free | $0 | 512MB RAM, sleeps after 15min |
| YOLOv8 | Free | $0 | 512MB RAM, sleeps after 15min |
| OpenRouter | Free | $0 | Rate limits apply |
| Frontend | Local | $0 | Runs on teammate's laptop |
| **Total** | | **$0** | Perfect for hackathon! |

**Optional upgrades (if needed):**
- Starter tier ($7/month per service): No sleep, 512MB RAM
- Standard tier ($25/month per service): 2GB RAM, faster

---

## 🎤 Demo Preparation

### 30 Minutes Before Demo:

1. **Wake up services** (run ping script above)
2. **Test end-to-end flow** (webcam → detection → analysis)
3. **Prepare demo items** (water bottle, apple, soda can, etc.)
4. **Have backup plan** (screenshots/video if network fails)

### During Demo:

1. **Start with health checks**
   - Show YOLOv8: `/health` endpoint
   - Show Backend: `/docs` Swagger UI

2. **Live detection demo**
   - Start with simple item (water bottle)
   - Show multiple items
   - Show confirmation workflow
   - Hit "Analyze with AI"

3. **Explain architecture**
   - "Backend and YOLO are deployed on Render"
   - "Frontend runs locally"
   - "Zero cost for hackathon"

---

## 📱 Share with Teammates

**Send them this:**

```
Hey team! Backend is deployed. To connect:

1. Create frontend/.env with:
   VITE_API_BASE_URL=https://rebin-backend-abc.onrender.com

2. Run:
   cd frontend
   npm install
   npm run dev

3. Open: http://localhost:5173

That's it! No need to run backend or YOLO locally.
```

---

## 🎯 Quick Reference

**Your Deployment URLs:**

```bash
# YOLOv8 Service
https://rebin-yolo-xyz.onrender.com
Health: /health
Predict: /predict

# Backend Service  
https://rebin-backend-abc.onrender.com
Docs: /docs
Infer: /infer
Explain: /explain

# Frontend (Local)
http://localhost:5173
```

**Save these for your demo!** 🚀

---

## 🎉 You're Done!

✅ Backend deployed  
✅ YOLO deployed  
✅ Frontend connected  
✅ $0 spent  
✅ Ready for hackathon  

**Now go build something amazing!** 💚🌍

