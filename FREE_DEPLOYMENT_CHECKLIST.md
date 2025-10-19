# ✅ FREE Deployment Checklist ($0 Budget)

## Pre-Flight Check
- [ ] GitHub repo is pushed
- [ ] Render.com account created (free)
- [ ] Ngrok account created (free)
- [ ] Ngrok installed: `brew install ngrok/ngrok/ngrok`
- [ ] OpenRouter API key ready

---

## Step 1: Deploy Backend to Render (Free)

- [ ] Go to https://render.com
- [ ] Click **"New+ → Web Service"**
- [ ] Connect GitHub repo
- [ ] Set **Root Directory:** `backend`
- [ ] Set **Runtime:** `Docker`  
- [ ] Set **Dockerfile:** `backend/Dockerfile.render`
- [ ] Choose **FREE** instance
- [ ] Add env vars:
  - [ ] `OPENROUTER_API_KEY` = your_key
  - [ ] `OPENROUTER_MODEL` = `openai/gpt-4o-mini`
  - [ ] `YOLO_INFER_URL` = `http://localhost:9000/predict` (temp)
  - [ ] `FRONTEND_ORIGIN` = `http://localhost:5173`
- [ ] Click **"Create Web Service"**
- [ ] Wait 5-10 minutes
- [ ] Copy backend URL: `https://rebin-backend-_____.onrender.com`
- [ ] Test: `curl https://your-backend-url/health` → Should work

---

## Step 2: Start YOLOv8 Locally

### Terminal 1: YOLOv8 Service

```bash
cd services/yolov8-local
source .venv/bin/activate  # or: python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

- [ ] Terminal shows: `INFO: Uvicorn running on http://0.0.0.0:9000`
- [ ] Test: Open http://localhost:9000/health in browser
- [ ] Should see: `{"status":"healthy","model_loaded":true}`
- [ ] **Keep this terminal running!**

---

## Step 3: Expose YOLOv8 with Ngrok

### Terminal 2: Ngrok Tunnel

```bash
# One-time setup (if first time)
ngrok config add-authtoken YOUR_TOKEN_FROM_NGROK_DASHBOARD

# Start tunnel
ngrok http 9000
```

- [ ] Terminal shows ngrok interface
- [ ] Copy the HTTPS URL: `https://_____.ngrok.io`
- [ ] Test: `curl https://your-ngrok-url/health`
- [ ] Should see: `{"status":"healthy","model_loaded":true}`
- [ ] **Keep this terminal running!**

---

## Step 4: Connect Backend to YOLOv8

- [ ] Go to Render dashboard → Your backend service
- [ ] Click **"Environment"** tab
- [ ] Update `YOLO_INFER_URL` to: `https://your-ngrok-url.ngrok.io/predict`
- [ ] Click **"Save Changes"**
- [ ] Wait 2-3 minutes for redeploy
- [ ] Backend logs should show no errors

---

## Step 5: End-to-End Test

### Test Full Flow

- [ ] Open frontend: `cd frontend && npm install && npm run dev`
- [ ] Create `frontend/.env`:
  ```
  VITE_API_BASE_URL=https://your-backend-url.onrender.com
  ```
- [ ] Restart frontend: `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Upload a test image (bottle, cup, banana)
- [ ] Should see detection results in 2-5 seconds
- [ ] Check browser console for errors

### If It Works: ✅
- [ ] You see detected objects on the right panel
- [ ] No errors in browser console
- [ ] Backend + YOLOv8 are connected!

### If It Doesn't Work: ❌
- [ ] Check Terminal 1 (YOLOv8) for errors
- [ ] Check Terminal 2 (ngrok) is still running
- [ ] Check Render backend logs
- [ ] Verify ngrok URL in backend env vars
- [ ] Try refreshing ngrok: stop & restart, update backend

---

## Step 6: Share with Teammates

- [ ] Send backend URL: `https://rebin-backend-_____.onrender.com`
- [ ] Send them `TEAMMATES_SETUP.md`
- [ ] They create `frontend/.env` with your backend URL
- [ ] They run: `npm install && npm run dev`
- [ ] Test with them: have them upload an image

---

## 🎯 Daily Checklist (Before Working)

Every time you work on the project:

- [ ] Terminal 1: Start YOLOv8
  ```bash
  cd services/yolov8-local
  source .venv/bin/activate
  python app.py
  ```

- [ ] Terminal 2: Start ngrok
  ```bash
  ngrok http 9000
  ```

- [ ] Copy new ngrok URL
- [ ] Update backend env var on Render (if URL changed)
- [ ] Wait 2-3 min for backend to redeploy
- [ ] Test: `curl https://your-backend-url/infer` (should not 500)

---

## 📱 Keep These Running

**During hackathon/demos:**
- ✅ Terminal 1: YOLOv8 service
- ✅ Terminal 2: Ngrok tunnel  
- ✅ Laptop: Awake & plugged in
- ✅ WiFi: Connected

**Before demos:**
- [ ] Start services 30 min early
- [ ] Test full flow once
- [ ] Keep laptop lid open
- [ ] Have charger plugged in

---

## 🐛 Troubleshooting

### YOLOv8 won't start?
```bash
cd services/yolov8-local
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Ngrok won't connect?
```bash
# Verify auth token
ngrok config check

# Try different port
ngrok http 9001
# Then update YOLOv8 to run on 9001
```

### Backend can't reach YOLOv8?
- Verify ngrok URL is correct (copy from Terminal 2)
- Must be `https://`, not `http://`
- Must end with `/predict`
- Example: `https://abc123.ngrok.io/predict`

### "First request is slow"?
- Normal! Render free tier sleeps after 15 min
- First request wakes it up (~30 sec)
- Subsequent requests are fast

---

## ✅ Success Criteria

You're ready for demos when:
- [ ] Backend health check works
- [ ] YOLOv8 health check works (via ngrok)
- [ ] Frontend loads without errors
- [ ] Can upload image and see detections
- [ ] Teammates can run frontend successfully
- [ ] All terminals are running
- [ ] Laptop is charged

---

## 💰 Total Cost: $0

**What you're running:**
- Render backend: **FREE**
- YOLOv8 local: **FREE**
- Ngrok tunnel: **FREE**
- Frontend: **FREE**

**Trade-off:**
- Must keep laptop awake & running
- Ngrok URL changes on restart
- Less reliable than paid hosting

**Worth it?** Absolutely for a hackathon! 🎉

---

## 📞 URLs to Share

```
Backend: https://______________________.onrender.com
YOLOv8 (ngrok): https://______________________.ngrok.io
Frontend: http://localhost:5173
```

**Only share backend URL with teammates!**

---

## 🎉 You're Done!

**Deployed Services:**
- ✅ Backend (Render Free)
- ✅ YOLOv8 (Local + Ngrok)
- ✅ Frontend (Teammates local)

**Cost: $0**
**Time: ~15 minutes**
**Reliability: Good (if laptop stays on)**

Happy hacking! 🚀

