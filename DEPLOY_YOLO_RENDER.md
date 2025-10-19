# 🚀 Deploy YOLOv8 to Render (Free Tier)

## ⚠️ Important Notes

**Free Tier Limitations:**
- First request will be slow (~30-60 seconds)
- Service sleeps after 15 min of inactivity
- 512MB RAM (tight for YOLOv11)
- May timeout on very large images

**But it works for a hackathon!** No laptop dependency! 🎉

---

## 📋 Deployment Steps

### Step 1: Go to Render Dashboard

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repo: `Rebin`

---

### Step 2: Configure Service

**Basic Settings:**
- **Name:** `rebin-yolo` (or any name)
- **Region:** Same as your backend
- **Branch:** `main` (or `sohi`)
- **Root Directory:** `services/yolov8-local`
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- **Free** (or Starter $7/month if you want better performance)

---

### Step 3: Click "Create Web Service"

Wait 10-15 minutes for deployment (downloads YOLOv11 model ~200MB)

You'll get a URL like: `https://rebin-yolo.onrender.com`

---

### Step 4: Update Backend Environment Variable

1. Go to your **backend** service on Render
2. Click **"Environment"** tab
3. Update `YOLO_INFER_URL` to:
   ```
   https://rebin-yolo.onrender.com/predict
   ```
4. Click **"Save Changes"**
5. Wait 2-3 minutes for backend to redeploy

---

### Step 5: Test

Open in browser: `https://rebin-yolo.onrender.com/health`

Should see:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

---

## ✅ What You Get

**Benefits:**
- ✅ No laptop dependency
- ✅ No ngrok needed
- ✅ Always available (even when laptop is off)
- ✅ Stable URL (doesn't change)
- ✅ $0 cost (free tier)

**Trade-offs:**
- ⚠️ Slower first request (cold start ~30-60s)
- ⚠️ May timeout on complex images
- ⚠️ 512MB RAM limit

---

## 🎯 Final Architecture

```
Frontend (Teammate's Laptop)
    ↓
Backend (Render Free) ← Always available
    ↓
YOLOv8 (Render Free) ← Always available
```

**Total Cost: $0** 🎉

---

## 💡 Pro Tips

### Keep It Warm During Demos

Free tier sleeps after 15 min. To keep it awake:

```bash
# Ping it every 10 minutes before/during demo
while true; do curl https://rebin-yolo.onrender.com/health; sleep 600; done
```

### If You Get Timeouts

The free tier is tight on memory. Options:
1. **Use smaller images** (frontend should resize before upload)
2. **Upgrade to Starter** ($7/month - faster, more reliable)
3. **Use ngrok locally** (faster but laptop-dependent)

---

## 🆚 Comparison

| Aspect | Render Free | Ngrok Local | Render Paid ($7) |
|--------|-------------|-------------|------------------|
| Cost | $0 | $0 | $7/month |
| Speed | Slow first req | Fast | Fast |
| Reliability | Good | Depends on laptop | Excellent |
| Setup | Deploy once | Daily ngrok | Deploy once |
| Cold starts | Yes (~60s) | No | Minimal (~5s) |

---

## ⚡ Quick Deploy

**Just copy these settings into Render:**

```
Name: rebin-yolo
Root Directory: services/yolov8-local
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
Instance: Free
```

**Then update backend env:**
```
YOLO_INFER_URL=https://rebin-yolo.onrender.com/predict
```

**Done!** 🎉

---

## 🎯 Recommendation

**For hackathon:**
- If budget is $0: Use **Render Free** (works, but slower)
- If you can spend $7: Use **Render Starter** (much better)
- If you're always at laptop: Use **ngrok local** (fastest)

Choose based on your priorities! All three work. ✅

