import os
import base64
import io
import json
import requests
from PIL import Image
from http import HTTPStatus
from ultralytics import YOLO

MODEL_URL = "https://huggingface.co/soshi04/Finger-Detection/resolve/main/best.pt"
MODEL_PATH = "/tmp/best.pt"

if not os.path.exists(MODEL_PATH):
    response = requests.get(MODEL_URL)
    with open(MODEL_PATH, "wb") as f:
        f.write(response.content)

model = YOLO(MODEL_PATH)

def handler(request):
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
        base64_image = body["image"].split(",")[1]
        image_bytes = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        results = model.predict(image, imgsz=800)[0]

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
                "Access-Control-Allow-Origin": "*",
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
