import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { FilterType } from '../types';

const FilterContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const VideoFilter = styled.div<{ $filter: FilterType }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  ${props => {
    switch (props.$filter) {
      case 'pastel':
        return `
          background: rgba(255, 192, 203, 0.15);
          backdrop-filter: brightness(1.1) saturate(0.8);
        `;
      case 'smooth':
        return `
          backdrop-filter: blur(1px) brightness(1.1);
        `;
      case 'sparkle':
        return ``;
      default:
        return '';
    }
  }}
`;

const FilterCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: overlay;
`;

interface FilterProps {
  filter: FilterType;
  videoElement?: HTMLVideoElement | null;
  onFilteredFrame?: (canvas: HTMLCanvasElement) => void;
}

const FilterOverlay: React.FC<FilterProps> = ({
  filter,
  videoElement,
  onFilteredFrame
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastDrawTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;    const updateCanvas = (timestamp: number) => {
      // Limit updates to ~24fps to reduce CPU usage
      if (timestamp - lastDrawTime.current < 42) { // ~24fps (1000ms/24 ≈ 42ms)
        animationFrameRef.current = requestAnimationFrame(updateCanvas);
        return;
      }

      // Match canvas size to video, but only if size has changed
      if (canvas.width !== videoElement.videoWidth || 
          canvas.height !== videoElement.videoHeight) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      }

      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply filter specific effects
      if (filter === 'sparkle') {
        // Draw sparkles
        const sparkleCount = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < sparkleCount; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 3 + 1;
          
          // Draw sparkle star
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5;
            const radius = j % 2 === 0 ? size : size / 2;
            const pointX = x + radius * Math.cos(angle);
            const pointY = y + radius * Math.sin(angle);
            
            if (j === 0) {
              ctx.moveTo(pointX, pointY);
            } else {
              ctx.lineTo(pointX, pointY);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      // If we need to pass the filtered frame back
      if (onFilteredFrame) {
        onFilteredFrame(canvas);
      }

      lastDrawTime.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(updateCanvas);
    };

    animationFrameRef.current = requestAnimationFrame(updateCanvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [filter, videoElement, onFilteredFrame]);

  return (
    <FilterContainer>
      <VideoFilter $filter={filter} />
      <FilterCanvas ref={canvasRef} />
    </FilterContainer>
  );
};

export default FilterOverlay;
