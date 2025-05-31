import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import useSound from '../hooks/useSound';
import type { FilterType } from '../types';
import FilterOverlay from './FilterOverlay';

const VideoContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 640px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Video = styled(motion.video)`
  width: 100%;
  transform: scaleX(-1);
  border-radius: 20px;
`;

const CountdownOverlay = styled(motion.div)<{ isVisible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8rem;
  color: white;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.3s ease;
  font-weight: bold;
`;

const ReadyText = styled(motion.div)`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const ErrorContainer = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  padding: 20px;
`;

const RetryButton = styled(motion.button)`
  background: white;
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;
  font-weight: bold;
  
  &:hover {
    background: #f0f0f0;
  }
`;

interface WebcamCaptureProps {
  onPhotoCaptured: (photoData: string) => void;
  isCountdownActive: boolean;
  countdownDuration?: number;
  selectedFilter: FilterType;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const CountdownAnimation = React.memo(({ countdown }: { countdown: number }) => (
  <motion.div 
    key="countdown-container"
    layoutId="countdown"
  >
    <ReadyText
      key="ready-text"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      Get Ready!
    </ReadyText>
    <CountdownOverlay
      key="countdown-overlay"
      isVisible={true}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {countdown}
    </CountdownOverlay>
  </motion.div>
));

const MemoizedFilterOverlay = React.memo(FilterOverlay);

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onPhotoCaptured,
  isCountdownActive,
  countdownDuration = 3,
  selectedFilter
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(countdownDuration);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { playCountdownBeep, playCaptureSound } = useSound();
  const [filteredCanvas, setFilteredCanvas] = useState<HTMLCanvasElement | null>(null);

  // Handle video load event
  const handleVideoLoad = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !filteredCanvas || !isVideoLoaded) return;

    // Create a canvas for the final photo
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // First draw the video frame (mirrored)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Then overlay the filtered canvas
    ctx.drawImage(filteredCanvas, 0, 0);

    // Convert to data URL and call the callback
    const photoData = canvas.toDataURL('image/png');
    onPhotoCaptured(photoData);
  }, [onPhotoCaptured, filteredCanvas, isVideoLoaded]);

  const startWebcam = useCallback(async () => {
    try {
      // Stop any existing streams
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setError(null);
      setIsVideoLoaded(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not access camera';
      setError(errorMessage);
      console.error('Error accessing webcam:', err);
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    const initWebcam = async () => {
      await startWebcam();
    };

    initWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
      }
      if (video) {
        video.srcObject = null;
      }
      setIsVideoLoaded(false);
    };
  }, [startWebcam, stream]);

  useEffect(() => {
    let isMounted = true;

    const runCountdown = async () => {
      if (isCountdownActive && countdown > 0) {
        playCountdownBeep();
        await sleep(1000);
        if (isMounted) {
          setCountdown(prev => prev - 1);
        }
      } else if (countdown === 0) {
        playCaptureSound();
        capturePhoto();
        if (isMounted) {
          setCountdown(countdownDuration);
        }
      }
    };

    if (isCountdownActive || countdown === 0) {
      runCountdown();
    }

    return () => {
      isMounted = false;
    };
  }, [isCountdownActive, countdown, countdownDuration, playCountdownBeep, playCaptureSound, capturePhoto]);

  return (
    <VideoContainer
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        onLoadedData={handleVideoLoad}
      />
      {error ? (
        <ErrorContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Camera Error</h3>
          <p>{error}</p>
          <RetryButton onClick={startWebcam}>
            Retry Camera Access
          </RetryButton>
        </ErrorContainer>
      ) : (
        <>
          <MemoizedFilterOverlay 
            key="filter-overlay"
            filter={selectedFilter}
            videoElement={videoRef.current}
            onFilteredFrame={setFilteredCanvas}
          />
          <AnimatePresence mode="wait" initial={false}>
            {isCountdownActive && countdown > 0 && (
              <CountdownAnimation countdown={countdown} />
            )}
          </AnimatePresence>
        </>
      )}
    </VideoContainer>
  );
};

export default WebcamCapture;
