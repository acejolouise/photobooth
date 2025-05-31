import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

interface FilterProps {
  filter: string;
  imageData: string;
}

const ImageFilter: React.FC<FilterProps> = ({ filter, imageData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const applyFilter = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = imageData;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        switch (filter) {
          case 'pastel':
            // Apply pastel effect            const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = pixelData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = data[i] * 0.8 + 255 * 0.2;     // Red
              data[i + 1] = data[i + 1] * 0.8 + 255 * 0.2; // Green
              data[i + 2] = data[i + 2] * 0.8 + 255 * 0.2; // Blue
            }
            ctx.putImageData(pixelData, 0, 0);
            break;

          case 'smooth':
            // Apply smoothing effect
            ctx.filter = 'blur(1px) brightness(1.1)';
            ctx.drawImage(img, 0, 0);
            break;

          case 'sparkle':
            // Draw sparkles
            const sparkleCount = 20;
            ctx.fillStyle = 'white';
            for (let i = 0; i < sparkleCount; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const size = Math.random() * 3 + 1;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
      };
    };

    applyFilter();
  }, [filter, imageData]);

  return <Canvas ref={canvasRef} />;
};

export default ImageFilter;
