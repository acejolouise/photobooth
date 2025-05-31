import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const StickerCanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const Canvas = styled(motion.canvas)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
`;

const StickerPanel = styled(motion.div)`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  justify-content: center;
  max-width: 90%;
  backdrop-filter: blur(10px);
`;

const StickerButton = styled(motion.button)<{ $active: boolean }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${props => props.$active ? 'rgba(255, 182, 193, 0.3)' : 'transparent'};
  border: 2px solid ${props => props.$active ? '#ff69b4' : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 182, 193, 0.2);
  }
`;

const UndoButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 0.75rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
`;

interface StickersOverlayProps {
  onSave?: (canvas: HTMLCanvasElement) => void;
}

interface StickerPosition {
  x: number;
  y: number;
  sticker: string;
  scale: number;
  rotation: number;
}

const stickers = [
  '❤️', '✨', '🌟', '💕', '🎀', '🌸', '✿', '💝', '🦋', '🌈', '⭐', '💫',
  '🌺', '🍭', '🎨', '🎭', '🎪'
];

const StickersOverlay: React.FC<StickersOverlayProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSticker, setSelectedSticker] = useState<string>('');
  const [stickerPositions, setStickerPositions] = useState<StickerPosition[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all stickers
    stickerPositions.forEach(({ x, y, sticker, scale, rotation }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker, 0, 0);
      
      ctx.restore();
    });

    if (onSave) {
      onSave(canvas);
    }
  }, [stickerPositions, onSave]);

  const handleUndo = () => {
    setStickerPositions(prev => {
      const newPositions = [...prev];
      newPositions.pop();
      return newPositions;
    });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const coordinates = { x: 0, y: 0 };

    if ('clientX' in e) {
      coordinates.x = e.clientX - rect.left;
      coordinates.y = e.clientY - rect.top;
    } else if ('touches' in e && e.touches[0]) {
      coordinates.x = e.touches[0].clientX - rect.left;
      coordinates.y = e.touches[0].clientY - rect.top;
    } else {
      return null;
    }

    return coordinates;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedSticker) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    setStickerPositions(prev => [...prev, {
      x: coords.x,
      y: coords.y,
      sticker: selectedSticker,
      scale: 1 + Math.random() * 0.4 - 0.2, // Random scale between 0.8 and 1.2
      rotation: (Math.random() - 0.5) * Math.PI * 0.5 // Random rotation ±45°
    }]);
  };

  return (
    <StickerCanvasContainer>
      <Canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        whileTap={{ scale: 0.99 }}
      />
      
      <StickerPanel
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {stickers.map(sticker => (
          <StickerButton
            key={sticker}
            $active={selectedSticker === sticker}
            onClick={() => setSelectedSticker(sticker)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {sticker}
          </StickerButton>
        ))}
      </StickerPanel>

      {stickerPositions.length > 0 && (
        <UndoButton
          onClick={handleUndo}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Undo
        </UndoButton>
      )}
    </StickerCanvasContainer>
  );
};

export default StickersOverlay;
