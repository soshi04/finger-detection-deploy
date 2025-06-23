import React, { useEffect, useRef, useState } from "react";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [predictions, setPredictions] = useState<any[]>([]);

  const captureAndSendFrame = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    const res = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });
    const data = await res.json();
    setPredictions(data);
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });

    const interval = setInterval(() => {
      captureAndSendFrame();
    }, 500); // every 0.5s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !videoRef.current) return;

    canvas.width = 640;
    canvas.height = 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    predictions.forEach((box) => {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      ctx.fillStyle = "lime";
      ctx.fillText(`Class ${box.class}`, box.x1, box.y1 - 5);
    });
  }, [predictions]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        width={640}
        height={480}
        style={{ transform: "scaleX(-1)" }} // ✅ Mirror webcam horizontally
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 640,
          height: 480,
          pointerEvents: "none", // optional: so it doesn't block mouse events
        }}
      />
    </div>
  );
};

export default App;
