import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

const BackgroundGraph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize points
    const initPoints = () => {
      pointsRef.current = [];
      const numPoints = 100;
      const centerY = canvas.height / 2;
      const amplitude = canvas.height * 0.9; // 90% of the screen height
      for (let i = 0; i < numPoints; i++) {
        pointsRef.current.push({
          x: (i / numPoints) * canvas.width,
          y: centerY + (Math.random() - 0.5) * amplitude
        });
      }
    };

    // Draw grid
    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    // Draw line graph
    const drawLine = () => {
      if (pointsRef.current.length < 2) return;
      const maxGap = 50; // If the gap is larger than this, don't draw the segment
      for (let i = 1; i < pointsRef.current.length; i++) {
        const prev = pointsRef.current[i - 1];
        const curr = pointsRef.current[i];
        if (Math.abs(curr.x - prev.x) > maxGap) continue; // skip wrap-around
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = curr.y < prev.y ? '#4caf50' : '#f44336';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      // Update points
      pointsRef.current.forEach((point, i) => {
        point.x -= 1;
        if (point.x < 0) {
          point.x = canvas.width;
          // Use the same amplitude as initialization
          const amplitude = canvas.height * 0.9;
          point.y = canvas.height / 2 + (Math.random() - 0.5) * amplitude;
        }
      });
      drawLine();
      requestAnimationFrame(animate);
    };

    // Initialize and start animation
    initPoints();
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#f5f5f5'
      }}
    />
  );
};

export default BackgroundGraph; 