from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from loguru import logger

from schemas import InferResponse, ItemDetection
from utils.http_client import http_client
from utils.openrouter_client import refine_label_with_vision
from utils.settings import YOLO_INFER_URL

router = APIRouter()


@router.post("", response_model=InferResponse)
async def infer(
    file: UploadFile = File(..., description="Image file"),
) -> InferResponse:
    """
    Calls the local YOLOv8 service and returns detected items.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail={"error": "validation_error", "message": "No filename provided"})
    
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail={"error": "validation_error", "message": "File must be an image"})
    
    # Check file size (limit to 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    try:
        # Read file data
        file_data = await file.read()
        
        if len(file_data) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail={"error": "validation_error", "message": "Image file too large (max 10MB)"})
        
        if len(file_data) == 0:
            raise HTTPException(status_code=400, detail={"error": "validation_error", "message": "Empty image file"})
        
        # Reset file pointer for YOLOv8 service
        await file.seek(0)
        
        files = {"file": (file.filename, file_data, file.content_type or "image/jpeg")}
        target = YOLO_INFER_URL
        logger.info(f"Calling YOLOv8 service: {target} with file: {file.filename} ({len(file_data)} bytes)")
        
        resp = await http_client.post(target, files=files, timeout=30.0)
        
        if resp.status_code == 503:
            logger.error("YOLOv8 service unavailable - model not loaded")
            raise HTTPException(
                status_code=503,
                detail={"error": "service_unavailable", "message": "Computer vision service is temporarily unavailable"},
            )
        elif resp.status_code == 400:
            logger.error(f"YOLOv8 validation error: {resp.text}")
            raise HTTPException(
                status_code=400,
                detail={"error": "validation_error", "message": "Invalid image format or size"},
            )
        elif resp.status_code != 200:
            logger.error(f"YOLOv8 call failed: {resp.status_code} {resp.text}")
            raise HTTPException(
                status_code=502,
                detail={"error": "cv_error", "message": "Computer vision service failed"},
            )

        try:
            data = resp.json()
        except Exception as e:
            logger.error(f"Invalid JSON response from YOLOv8: {e}")
            raise HTTPException(
                status_code=502,
                detail={"error": "cv_error", "message": "Invalid response from computer vision service"},
            )
        
        items: List[ItemDetection] = []
        objects = data.get("objects", [])
        
        if not isinstance(objects, list):
            logger.error(f"Invalid objects format from YOLOv8: {objects}")
            raise HTTPException(
                status_code=502,
                detail={"error": "cv_error", "message": "Invalid response format from computer vision service"},
            )
        
        # Ambiguous labels that need Gemini refinement
        AMBIGUOUS_LABELS = {"bottle", "cup", "bowl", "container"}
        CONFIDENCE_THRESHOLD = 0.7  # Refine if confidence < 70%
        ENABLE_REFINEMENT = False  # Disabled due to Gemini rate limits
        
        for obj in objects:
            try:
                label = str(obj.get("label", "unknown"))
                confidence = float(obj.get("confidence", 0.0))
                
                # Check if label needs refinement
                needs_refinement = (
                    ENABLE_REFINEMENT and  # Only if enabled
                    (label.lower() in AMBIGUOUS_LABELS or confidence < CONFIDENCE_THRESHOLD)
                )
                
                if needs_refinement:
                    logger.info(f"Label '{label}' ({int(confidence * 100)}%) is ambiguous, refining with Gemini Vision...")
                    try:
                        refined = await refine_label_with_vision(file_data, label, confidence)
                        # Use refined label and add metadata
                        items.append(
                            ItemDetection(
                                label=refined.get("label", label),
                                confidence=confidence,
                                bin=refined.get("bin"),
                                explanation=refined.get("reason"),
                            )
                        )
                        logger.info(f"✨ Refined: '{label}' → '{refined.get('label')}' (bin: {refined.get('bin')})")
                    except Exception as e:
                        logger.warning(f"Refinement failed for '{label}', using YOLO label: {e}")
                        items.append(ItemDetection(label=label, confidence=confidence))
                else:
                    # Clear label, use YOLO result
                    items.append(ItemDetection(label=label, confidence=confidence))
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid detection object: {obj}, error: {e}")
                continue
        
        logger.info(f"Successfully processed image: {len(items)} objects detected")
        return InferResponse(items=items, zip=None)
        
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error during infer")
        raise HTTPException(
            status_code=500, detail={"error": "server_error", "message": "Internal server error during image processing"}
        )
