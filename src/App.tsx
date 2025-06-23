import { useEffect, useRef, useState } from "react";

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

    try {
      const res = await fetch("https://soshi04-finger-detection.hf.space/run/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [imageData] }),
      });

      const result = await res.json();
      setPredictions(result.data[0]); // Adjust this if your output is shaped differently
    } catch (err) {
      console.error("Error sending frame:", err);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });

    const interval = setInterval(() => {
      captureAndSendFrame();
    }, 1000); // every 1s to prevent spam

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = 640;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((box) => {
      const { x1, y1, x2, y2, class: cls, conf } = box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = "black";
      ctx.font = "16px sans-serif";
      ctx.fillText(`Class ${cls} (${(conf * 100).toFixed(1)}%)`, x1 + 4, y1 - 6);
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
        style={{ transform: "scaleX(-1)", position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 640,
          height: 480,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default App;
