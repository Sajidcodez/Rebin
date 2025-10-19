# Dockerfile for YOLOv8 Service on Render
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download YOLOv11 model on build (so it's cached)
RUN python -c "from ultralytics import YOLO; YOLO('yolo11l.pt')"

# Expose port (Render will provide PORT env variable)
EXPOSE 9000

# Run the app (Render provides PORT, default to 9000)
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-9000}
