# 🆓 ReBin Pro - FREE Deployment (Backend + YOLOv8)

## Total Cost: $0

**Setup:**
- Backend on Render (Free tier)
- YOLOv8 local + ngrok (Free)
- Frontend local (teammates)

---

## 🚀 Step 1: Deploy Backend to Render (Free)

1. Go to https://render.com → Sign up/login
2. Click **"New+ → Web Service"**
3. Connect GitHub repo `Rebin`
4. Configure:
   - **Name:** `rebin-backend`
   - **Branch:** `main` (or `sohi`)
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `backend/Dockerfile.render`
   - **Instance Type:** **Free**

5. Add Environment Variables:
   ```
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=openai/gpt-4o-mini
   YOLO_INFER_URL=http://localhost:9000/predict
   FRONTEND_ORIGIN=http://localhost:5173
   ```
   *(We'll update YOLO_INFER_URL in Step 3)*

6. Click **"Create Web Service"**
7. Wait 5-10 minutes
8. Copy your backend URL: `https://rebin-backend-xyz.onrender.com`

---

## 🖥️ Step 2: Run YOLOv8 Locally

### Terminal 1: Start YOLOv8 Service

```bash
cd /Users/sohilol/rebin/Rebin/services/yolov8-local

# Activate venv (if you don't have it, create it)
source .venv/bin/activate

# Install dependencies (if not done)
pip install -r requirements.txt

# Run YOLOv8 service on port 9000
python app.py
```

Keep this terminal running! 

Test it: http://localhost:9000/health → Should return `{"status":"healthy"}`

---

## 🌐 Step 3: Expose YOLOv8 with Ngrok

### Terminal 2: Start Ngrok

```bash
# Install ngrok (if you haven't)
brew install ngrok/ngrok/ngrok

# Sign up at https://dashboard.ngrok.com/signup
# Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

# Add auth token (one-time setup)
ngrok config add-authtoken YOUR_TOKEN_HERE

# Expose YOLOv8 service (port 9000)
ngrok http 9000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:9000
```

**Copy the HTTPS URL:** `https://abc123.ngrok.io`

Keep this terminal running!

---

## 🔗 Step 4: Connect Backend to YOLOv8

1. Go to Render dashboard → Your backend service
2. Click **"Environment"** tab
3. Update `YOLO_INFER_URL` to:
   ```
   YOLO_INFER_URL=https://abc123.ngrok.io/predict
   ```
   *(Replace with your actual ngrok URL)*

4. Click **"Save Changes"** → Backend will redeploy (2-3 min)

---

## ✅ Step 5: Test Everything

### Test YOLOv8 via Ngrok
```bash
curl https://your-ngrok-url.ngrok.io/health
```
Should return: `{"status":"healthy","model_loaded":true}`

### Test Backend
```bash
curl https://your-backend-url.onrender.com/health
```
Should return: `{"status":"healthy"}`

---

## 👥 Step 6: Share with Teammates

Send them your backend URL: `https://rebin-backend-xyz.onrender.com`

They create `frontend/.env`:
```env
VITE_API_BASE_URL=https://rebin-backend-xyz.onrender.com
```

Then run:
```bash
cd frontend
npm install
npm run dev
```

**Done!** They're using your deployed backend + local YOLOv8.

---

## 📋 Daily Workflow

**When you work on the project:**

```bash
# Terminal 1: YOLOv8
cd services/yolov8-local
source .venv/bin/activate
python app.py

# Terminal 2: Ngrok
ngrok http 9000

# Copy the new ngrok URL (changes each time)
# Update backend env var on Render with new URL
```

**⚠️ Important:** 
- Ngrok URL changes every time you restart it
- Update backend env var each time
- Keep your laptop running during demos/testing

---

## 🎯 Pros & Cons

### ✅ Pros:
- **$0 cost** (completely free)
- YOLOv8 runs fast locally (no cold starts)
- Easy to debug (local logs)
- Backend is always available (on Render)

### ⚠️ Cons:
- Must keep laptop running during demos
- Ngrok URL changes on restart
- If laptop sleeps, YOLOv8 is down
- Must update backend env var when ngrok URL changes

---

## 💡 Pro Tips

### Keep Ngrok URL Stable
- Don't restart ngrok during hackathon
- Keep laptop awake (System Preferences → Energy)
- Use a power source (not battery)

### During Demo/Judging
- Start YOLOv8 + ngrok 30 min before
- Test the full flow once
- Keep laptop lid open
- Have backend URL ready to share

### If Ngrok Disconnects
1. Restart ngrok
2. Copy new URL
3. Update Render backend env var
4. Wait 2-3 min for backend to redeploy
5. Test again

---

## 🔄 Alternative: Ngrok Paid ($10/month)

If you want **stable URLs** that don't change:

```bash
# Upgrade ngrok ($10/month)
# Get a reserved domain: https://dashboard.ngrok.com/cloud-edge/domains

ngrok http 9000 --domain=your-reserved-domain.ngrok.app
```

Then your `YOLO_INFER_URL` never changes!

---

## 🆚 Free vs Paid Comparison

| Feature | Free (Ngrok Free) | Paid (Render $7) |
|---------|------------------|------------------|
| Cost | $0 | $7/month |
| Laptop needed? | Yes (must stay on) | No |
| URL stability | Changes on restart | Permanent |
| Speed | Fast (local) | Medium (cold starts) |
| Reliability | Depends on laptop | Very reliable |
| Setup time | 5 minutes | 15 minutes |

**For hackathon:** Free works great if you're careful!

---

## 🎉 You're All Set!

**What you have:**
- ✅ Backend on Render (free, always available)
- ✅ YOLOv8 local + ngrok (free, fast)
- ✅ Teammates run frontend only
- ✅ **Total cost: $0**

**What to keep running:**
- Terminal 1: YOLOv8 service
- Terminal 2: Ngrok tunnel
- Your laptop (awake, plugged in)

**Share with teammates:**
```
Backend URL: https://rebin-backend-xyz.onrender.com
```

Happy hacking! 🚀

