# Quick Setup for Frontend Teammates 🚀

## You only need to run the frontend!

### 1️⃣ One-Time Setup

```bash
# Clone the repo (if you haven't)
git clone <repo-url>
cd Rebin/frontend

# Install dependencies
npm install
```

### 2️⃣ Create Environment File

Create a file `frontend/.env`:

```env
VITE_API_BASE_URL=https://rebin-backend.onrender.com
```

> **Replace the URL above with the actual Render URL Sohi gives you!**

### 3️⃣ Run Frontend

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## That's it! ✅

**You DON'T need:**
- ❌ Python
- ❌ Backend setup
- ❌ YOLOv8 installation
- ❌ API keys
- ❌ Database setup

**The backend is already running on Render, courtesy of Sohi!**

---

## Troubleshooting

### "Network Error" in browser console?
- Check that `frontend/.env` has the correct backend URL
- Ask Sohi for the latest Render URL
- Make sure you restarted `npm run dev` after creating `.env`

### "CORS error"?
- Tell Sohi - he needs to add your origin to backend CORS config

### Changes not showing up?
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear browser cache
- Check if you're editing the right file

### Port 5173 already in use?
- Kill the process: `lsof -ti:5173 | xargs kill`
- Or Vite will auto-assign a different port (5174, 5175, etc.)

---

## Git Workflow

```bash
# Pull latest changes
git pull origin main

# Create your feature branch
git checkout -b feature/your-name

# Make changes, then commit
git add .
git commit -m "Add: your feature description"

# Push your branch
git push origin feature/your-name

# Create PR on GitHub
```

---

## Need Help?

**Backend issues?** → Ask Sohi  
**Frontend issues?** → Ask the team  
**Git issues?** → Ask anyone

Happy coding! 🎉

