# 🚀 ReBin Pro - Hackathon Deployment Checklist

## Before You Start
- [ ] GitHub repo is up to date
- [ ] All code is committed and pushed
- [ ] You have a Render.com account (free signup)
- [ ] You have your OpenRouter API key ready

---

## Step 1: Deploy Backend (5 min)

- [ ] Go to https://render.com
- [ ] Click **"New+ → Web Service"**
- [ ] Connect GitHub repo `Rebin`
- [ ] Set **Root Directory:** `backend`
- [ ] Set **Runtime:** `Docker`
- [ ] Set **Dockerfile Path:** `backend/Dockerfile.render`
- [ ] Choose **Free** instance type
- [ ] Add Environment Variables:
  - [ ] `OPENROUTER_API_KEY` = your_key
  - [ ] `OPENROUTER_MODEL` = `openai/gpt-4o-mini`
  - [ ] `YOLO_INFER_URL` = `http://localhost:9000/predict` (temp - update in Step 3)
  - [ ] `FRONTEND_ORIGIN` = `http://localhost:5173`
- [ ] Click **"Create Web Service"**
- [ ] Wait 5-10 minutes for deployment
- [ ] Copy your backend URL: `https://rebin-backend-xyz.onrender.com`
- [ ] Test: Open `https://your-backend-url/health` → Should see `{"status":"healthy"}`

---

## Step 2: Deploy YOLOv8 Service (15 min)

- [ ] In Render Dashboard, click **"New+ → Web Service"**
- [ ] Connect same GitHub repo `Rebin`
- [ ] Set **Root Directory:** `services/yolov8-local`
- [ ] Set **Runtime:** `Docker`
- [ ] Set **Dockerfile Path:** `services/yolov8-local/Dockerfile`
- [ ] Choose **Starter ($7/month)** instance (⚠️ required for speed)
- [ ] No environment variables needed
- [ ] Click **"Create Web Service"**
- [ ] Wait 10-15 minutes (downloads 200MB model)
- [ ] Copy your YOLOv8 URL: `https://rebin-yolo-xyz.onrender.com`
- [ ] Test: Open `https://your-yolo-url/health` → Should see `{"status":"healthy"}`

---

## Step 3: Connect Backend to YOLOv8

- [ ] Go to your **backend service** on Render
- [ ] Click **"Environment"** tab
- [ ] Update `YOLO_INFER_URL` to: `https://your-yolo-url.onrender.com/predict`
- [ ] Click **"Save Changes"**
- [ ] Wait 2-3 minutes for backend to redeploy
- [ ] Test: `curl -X POST https://your-backend-url/infer` (should return error, but not 500)

---

## Step 4: Update Frontend for Teammates

- [ ] Share with teammates: Backend URL `https://your-backend-url.onrender.com`
- [ ] They create `frontend/.env`:
  ```env
  VITE_API_BASE_URL=https://your-backend-url.onrender.com
  ```
- [ ] They run:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- [ ] Test: Open http://localhost:5173 → Should load without errors

---

## Step 5: Final Testing

### Backend Health Check
- [ ] `curl https://your-backend-url/health`
- [ ] Should return: `{"status":"healthy"}`

### YOLOv8 Health Check
- [ ] `curl https://your-yolo-url/health`
- [ ] Should return: `{"status":"healthy","model_loaded":true}`

### Full Integration Test
- [ ] Open frontend at http://localhost:5173
- [ ] Click "Start Scanning" (or "Upload Image")
- [ ] Upload a test image (bottle, cup, etc.)
- [ ] Should see detection results in 2-5 seconds
- [ ] If errors, check browser console + Render logs

---

## 🎉 You're Done!

**Deployed URLs:**
- Backend: `https://rebin-backend-xyz.onrender.com`
- YOLOv8: `https://rebin-yolo-xyz.onrender.com`

**What's Working:**
- ✅ Backend API (FastAPI)
- ✅ YOLOv8 object detection
- ✅ OpenRouter/Gemini reasoning
- ✅ CORS configured for local frontend
- ✅ Health checks for monitoring

**Teammates Can Now:**
- Run frontend only (no Python setup)
- Work independently on UI/features
- Test with real deployed backend

---

## 🐛 If Something Breaks

**Backend won't start?**
1. Check Render logs: Service → Logs tab
2. Verify all env vars are set
3. Check if `requirements.txt` is missing dependencies

**YOLOv8 is slow?**
1. Upgrade to Starter instance ($7/month)
2. Free tier times out on large models

**CORS errors?**
1. Check `FRONTEND_ORIGIN` env var
2. Try: `FRONTEND_ORIGIN=*` (dev only)

**First request is slow?**
- Normal! Free tier sleeps after 15 min
- First request wakes it up (~30 sec)
- Keep pinging `/health` to keep warm

---

## 💰 Cost Breakdown

**Current Setup:**
- Backend (Free): $0
- YOLOv8 (Starter): $7/month
- **Total: $7/month**

**Alternative (Free but less reliable):**
- Backend (Free): $0
- YOLOv8 (Local + ngrok): $0
- **Total: $0** (but requires your laptop running)

---

## 📱 Keep These URLs Handy

```
Backend: https://______________________.onrender.com
YOLOv8:  https://______________________.onrender.com
Frontend: http://localhost:5173
```

**Share backend URL with teammates!**

