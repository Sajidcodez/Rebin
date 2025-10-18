from fastapi import FastAPI, File, UploadFile, HTTPException
import logging, io
import numpy as np
from PIL import Image

# --- PyTorch safe allow-list MUST come before any model load ---
import torch
from torch.serialization import add_safe_globals, safe_globals
from ultralytics.nn.tasks import DetectionModel           # import the class itself
import torch.nn.modules.container as container            # Sequential lives here

# allow-list both classes you’ll see in YOLOv8 checkpoints
add_safe_globals([DetectionModel, container.Sequential])

from ultralytics import YOLO  # import after the allow-list so internal loads are safe

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLOv11 Local Service")

try:
    # wrap the load in a safe_globals context to be extra sure
    with safe_globals([DetectionModel, container.Sequential]):
        model = YOLO("yolo11l.pt")  # auto-downloads if not present
    logger.info("yolo11l model loaded successfully")
except FileNotFoundError:
    logger.error("yolo11l weights not found and could not be downloaded")
    model = None
except torch.serialization.pickle.UnpicklingError as e:
    logger.error(f"Model file corrupted or incompatible: {e}")
    model = None
except Exception as e:
    logger.error(f"Failed to load yolo11l model: {e}")
    model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="yolo11l model not loaded - service unavailable")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (limit to 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    try:
        image_data = await file.read()
        
        if len(image_data) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Image file too large (max 10MB)")
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Try to open and process image
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        image_array = np.array(image)
        
        # Validate image dimensions
        if image_array.shape[0] == 0 or image_array.shape[1] == 0:
            raise HTTPException(status_code=400, detail="Image has invalid dimensions")

        results = model(image_array, conf=0.2)
        logger.info(f"Processed image: {image_array.shape}, found {len(results)} result(s)")
        
        detections = []
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    label = model.names[class_id]
                    conf = float(box.conf[0])
                    detections.append({"label": label, "confidence": conf})

        logger.info(f"Detected {len(detections)} objects: {[d['label'] for d in detections]}")
        return {"objects": detections}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal prediction error")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
