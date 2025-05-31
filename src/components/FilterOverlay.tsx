import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
import { BlurFilter } from '@pixi/filter-blur';
import type { FilterType } from '../types';
import styled from 'styled-components';

const HiddenContainer = styled.div`
  display: none;
`;

interface FilterOverlayProps {
  filter: FilterType;
  videoElement: HTMLVideoElement | null;
  onFilteredFrame: (canvas: HTMLCanvasElement) => void;
}

const createFilter = (type: FilterType): PIXI.Filter[] => {
  switch (type) {
    case 'sepia': {
      const matrix = new ColorMatrixFilter();
      const sepia = [
        1.0, 0.3, 0.3, 0, 0,
        0.8, 0.9, 0.3, 0, 0,
        0.3, 0.3, 0.5, 0, 0,
        0, 0, 0, 1, 0
      ];
      matrix.matrix = sepia;
      return [matrix];
    }
    case 'vintage': {
      const matrix = new ColorMatrixFilter();
      matrix.brightness(0.9, false);
      matrix.saturate(-0.2);
      const adjustment = new AdjustmentFilter({
        gamma: 0.8,
        saturation: 0.8,
        contrast: 1.2
      });
      return [matrix, adjustment];
    }
    case 'noir': {
      const matrix = new ColorMatrixFilter();
      const grayscale = [
        0.33, 0.33, 0.33, 0, 0,
        0.33, 0.33, 0.33, 0, 0,
        0.33, 0.33, 0.33, 0, 0,
        0, 0, 0, 1, 0
      ];
      matrix.matrix = grayscale;
      const adjustment = new AdjustmentFilter({
        contrast: 1.4,
        brightness: 1.2
      });
      return [matrix, adjustment];
    }
    case 'vivid': {
      const adjustment = new AdjustmentFilter({
        saturation: 1.5,
        contrast: 1.2,
        brightness: 1.1
      });
      return [adjustment];
    }
    case 'dreamy': {
      const matrix = new ColorMatrixFilter();
      const dreamyMatrix = [
        1.1, 0, 0, 0, 0,
        0, 1.1, 0, 0, 0,
        0, 0, 1.3, 0, 0,
        0, 0, 0, 1, 0
      ];
      matrix.matrix = dreamyMatrix;
      const blur = new BlurFilter(2);
      const adjustment = new AdjustmentFilter({
        saturation: 0.8,
        gamma: 0.8
      });
      return [matrix, blur, adjustment];
    }
    case 'blur': {
      return [new BlurFilter(4)];
    }
    case 'pixelate': {
      class PixelateFilter extends PIXI.Filter {
        constructor(size = 10) {
          const fragmentShader = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform vec2 size;
            uniform vec4 filterArea;
            void main(void) {
              vec2 pos = vTextureCoord * filterArea.xy;
              vec2 pixelSize = size;
              vec2 coord = floor(pos / pixelSize) * pixelSize;
              vec2 uv = coord / filterArea.xy;
              gl_FragColor = texture2D(uSampler, uv);
            }
          `;
          super(null, fragmentShader, {
            size: new Float32Array([10, 10])
          });
        }
      }
      return [new PixelateFilter(8)];
    }
    default:
      return [];
  }
};

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  filter,
  videoElement,
  onFilteredFrame
}) => {
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoTextureRef = useRef<PIXI.Texture | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    if (!videoElement || !containerRef.current) return;

    const initPixiApp = async () => {
      try {
        // Ensure video dimensions are available
        if (!videoElement.videoWidth) {
          await new Promise<void>((resolve) => {
            const handleLoadedMetadata = () => {
              videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
              resolve();
            };
            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          });
        }

        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;

        // Create or update PIXI application
        if (!pixiAppRef.current && containerRef.current) {
          pixiAppRef.current = new PIXI.Application({
            width,
            height,
            backgroundAlpha: 0,
            antialias: true,
            clearBeforeRender: true,
          });
          containerRef.current.appendChild(pixiAppRef.current.view as HTMLCanvasElement);
        }

        const app = pixiAppRef.current;
        if (!app) return;

        // Clean up previous texture if it exists
        if (videoTextureRef.current) {
          videoTextureRef.current.destroy(true);
        }

        // Create and update video texture
        videoTextureRef.current = PIXI.Texture.from(videoElement);
        videoTextureRef.current.baseTexture.resource.autoPlay = true;
        videoTextureRef.current.baseTexture.resource.updateFPS = 60; // Increased for smoother updates

        const videoSprite = new PIXI.Sprite(videoTextureRef.current);
        videoSprite.width = width;
        videoSprite.height = height;

        // Clear and set up stage
        app.stage.removeChildren();
        app.stage.addChild(videoSprite);

        // Apply filters
        const filters = createFilter(filter);
        videoSprite.filters = filters;

        // Update frame with proper frame timing
        const updateFrame = () => {
          if (app.view instanceof HTMLCanvasElement) {
            // Update texture from video
            if (videoTextureRef.current) {
              videoTextureRef.current.update();
            }
            
            // Render and pass to callback
            app.render();
            onFilteredFrame(app.view);
          }
          frameIdRef.current = requestAnimationFrame(updateFrame);
        };

        frameIdRef.current = requestAnimationFrame(updateFrame);
      } catch (err) {
        console.error('Error initializing PixiJS:', err);
      }
    };

    initPixiApp();

    return () => {
      // Clean up resources
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }
      if (videoTextureRef.current) {
        videoTextureRef.current.destroy(true);
        videoTextureRef.current = null;
      }
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        pixiAppRef.current = null;
      }
    };
  }, [filter, videoElement, onFilteredFrame]);

  return <HiddenContainer ref={containerRef} />;
};

export default React.memo(FilterOverlay);
