# ⚡ Render Deployment - Quick Reference

## Backend Setup (No Docker)

### On Render.com:

```
Runtime: Python 3
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance: Free
```

### Environment Variables:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openai/gpt-4o-mini
YOLO_INFER_URL=http://localhost:9000/predict
FRONTEND_ORIGIN=http://localhost:5173
```

---

## YOLOv8 Local + Ngrok

### Terminal 1: YOLOv8
```bash
cd services/yolov8-local
source .venv/bin/activate
python app.py
```

### Terminal 2: Ngrok
```bash
ngrok http 9000
# Copy the https URL
```

### Update Backend on Render:
```
YOLO_INFER_URL=https://your-ngrok-url.ngrok.io/predict
```

---

## Teammates Setup

### Create `frontend/.env`:
```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

### Run:
```bash
cd frontend
npm install
npm run dev
```

---

## That's It! 🎉

**Time:** 10 minutes  
**Cost:** $0  
**Reliability:** Good (keep laptop on)

