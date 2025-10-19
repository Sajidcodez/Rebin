# Render.com Deployment Guide for ReBin Pro

## 🚀 Quick Deploy (5 minutes)

### Step 1: Push to GitHub

```bash
# From your project root
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### Step 2: Deploy Backend to Render

1. Go to https://render.com (sign up/login)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `Rebin`
4. Configure:

**Basic Settings:**
- **Name:** `rebin-backend` (or any name)
- **Region:** Choose closest to you
- **Branch:** `main` (or `sohi`)
- **Root Directory:** `backend`
- **Runtime:** `Docker`
- **Dockerfile Path:** `backend/Dockerfile.render`

**Build & Deploy:**
- **Build Command:** (leave empty - Docker handles it)
- **Start Command:** (leave empty - Docker handles it)

**Instance Type:**
- Free tier is fine for hackathon

5. Click **"Advanced"** → Add Environment Variables:

```
OPENROUTER_API_KEY=your_actual_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
YOLO_INFER_URL=http://localhost:9000/predict
FRONTEND_ORIGIN=http://localhost:5173
```

6. Click **"Create Web Service"**

Wait 5-10 minutes for deployment. You'll get a URL like:
`https://rebin-backend.onrender.com`

### Step 3: Deploy YOLOv8 Service to Render

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect same GitHub repo: `Rebin`
3. Configure:

**Basic Settings:**
- **Name:** `rebin-yolo` (or any name)
- **Region:** Same as backend
- **Branch:** `main` (or `sohi`)
- **Root Directory:** `services/yolov8-local`
- **Runtime:** `Docker`
- **Dockerfile Path:** `services/yolov8-local/Dockerfile`

**Instance Type:**
- ⚠️ **Important:** Use at least **Starter ($7/month)** instance
- Free tier will be too slow and may timeout
- YOLOv11 model is large (~200MB) and needs memory

4. No environment variables needed!

5. Click **"Create Web Service"**

Wait 10-15 minutes for first deployment (downloads large model).
You'll get a URL like: `https://rebin-yolo.onrender.com`

### Step 4: Update Backend with YOLOv8 URL

Go back to your **backend service** on Render:
1. Click **"Environment"** tab
2. Update `YOLO_INFER_URL`:
   ```
   YOLO_INFER_URL=https://rebin-yolo.onrender.com/predict
   ```
3. Click **"Save Changes"** → Backend will auto-redeploy

### Step 5: Update Frontend

Your teammates create `frontend/.env`:
```env
VITE_API_BASE_URL=https://rebin-backend.onrender.com
```

Then run:
```bash
cd frontend
npm install
npm run dev
```

**Done!** Frontend talks to your deployed backend.

---

## 📋 Environment Variables Needed

### Required:
- `OPENROUTER_API_KEY` - Get from https://openrouter.ai/keys

### Optional:
- `SUPABASE_URL` - For data storage
- `SUPABASE_ANON_KEY` - For data storage  
- `ELEVENLABS_API_KEY` - For voice TTS
- `FRONTEND_ORIGIN` - CORS origin (defaults to localhost)
- `YOLO_INFER_URL` - YOLOv8 service endpoint

---

## 🔧 Troubleshooting

### Backend not starting?
1. Check logs in Render dashboard
2. Verify all required env vars are set
3. Check if `requirements.txt` has all dependencies

### CORS errors?
1. Add your frontend URL to `FRONTEND_ORIGIN` env var
2. Or update `backend/main.py` allowed_origins list

### YOLOv8 connection failed?
1. Make sure YOLOv8 is running (locally or on Render)
2. Update `YOLO_INFER_URL` to correct endpoint
3. Test endpoint: `curl https://your-yolo-url/health`

### Slow first request?
- Render free tier spins down after 15 min inactivity
- First request will take ~30s to wake up
- Keep the app "warm" during demo/testing

---

## 💡 Pro Tips

**For Hackathon:**
- ✅ Deploy backend + YOLOv8 to Render (reliable for demos)
- ✅ Use Starter ($7/month) for YOLOv8 (free tier is too slow)
- ✅ Teammates only run frontend
- ✅ Backend can use free tier (it's lightweight)

**Cost Estimate:**
- Backend: **Free** (sufficient)
- YOLOv8: **$7/month** Starter (required for speed)
- **Total: $7/month** during hackathon

**Alternative (if budget is $0):**
- Deploy backend to Render (free)
- Run YOLOv8 locally + expose via ngrok
- Update backend env: `YOLO_INFER_URL=https://your-ngrok-url/predict`
- Keep your laptop awake during demos

**For Production:**
- Both services on paid tier for no cold starts
- Add custom domain
- Enable auto-deploy on push
- Add monitoring/alerts

---

## 📞 Share with Teammates

**They only need:**
1. Clone the repo
2. Create `frontend/.env`:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```
3. Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

**No Python, no backend setup, no env config needed!**

