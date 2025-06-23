# backend/api/predict.py

from ultralytics import YOLO
import base64
import io
from PIL import Image
import json
from http import HTTPStatus

model = YOLO("backend/best.pt")

def handler(request):
    # Allow CORS
    if request.method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        }

    try:
        body = request.json()
        base64_image = body["image"].split(",")[1]  # Remove "data:image/jpeg;base64,"
        image_bytes = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Inference
        results = model.predict(image, imgsz=800)[0]

        # Convert detections to simple JSON
        predictions = []
        for box in results.boxes:
            b = box.xyxy[0].tolist()
            c = int(box.cls[0])
            predictions.append({
                "x1": int(b[0]),
                "y1": int(b[1]),
                "x2": int(b[2]),
                "y2": int(b[3]),
                "class": c,
                "conf": float(box.conf[0])
            })

        return {
            "statusCode": HTTPStatus.OK,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # ✅ allow frontend
                "Content-Type": "application/json",
            },
            "body": json.dumps(predictions),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)}),
        }
