import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Application configuration
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
YOLO_INFER_URL = os.environ.get("YOLO_INFER_URL", "http://localhost:9000/predict")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

# Debug logging
print(f"Looking for .env at: {Path('.env').absolute()}")
print(f".env file exists: {Path('.env').exists()}")
print(f"OPENROUTER_API_KEY loaded: {bool(OPENROUTER_API_KEY)}")
if OPENROUTER_API_KEY:
    print(f"API key starts with: {OPENROUTER_API_KEY[:10]}...")
