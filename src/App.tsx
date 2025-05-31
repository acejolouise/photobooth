import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactConfetti from 'react-confetti';
import { SparklesIcon, PhotoIcon, ShareIcon } from '@heroicons/react/24/solid';
import type { Photo, FilterType, Filter } from './types';
import WebcamCapture from './components/WebcamCapture';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, shareTitle }) => (
  <Dialog open={isOpen} onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="glass-panel p-6 max-w-sm w-full">
        <Dialog.Title className="text-xl font-bold mb-4 text-center text-gray-800">
          Share Your Photos
        </Dialog.Title>
        
        <div className="flex justify-center gap-4 mb-6">
          <button 
            className="btn-primary flex-1"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success('Link copied to clipboard!');
              onClose();
            }}
          >
            Copy Link
          </button>
          
          <button
            className="btn-primary flex-1"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: shareTitle,
                  text: 'Check out my photobooth pictures!',
                  url: shareUrl,
                });
              }
              onClose();
            }}
          >
            Share
          </button>
        </div>
        
        <button
          className="w-full filter-button"
          onClick={onClose}
        >
          Close
        </button>
      </Dialog.Panel>
    </div>
  </Dialog>
);

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const photosNeeded = 4;

  const handlePhotoCaptured = (photoData: string) => {
    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      dataUrl: photoData,
      filter: selectedFilter
    };
    
    setPhotos(prev => [...prev, newPhoto]);
    
    if (photos.length + 1 === photosNeeded - 1) {
      toast.info('One more photo to go! 📸', {
        position: 'top-center',
        autoClose: 2000
      });
    } else if (photos.length + 1 === photosNeeded) {
      setShowConfetti(true);
      toast.success('🎉 Photo session complete!', {
        position: 'top-center',
        autoClose: 3000
      });
      setTimeout(() => setShowConfetti(false), 5000);
    }
    
    if (photos.length + 1 < photosNeeded) {
      setTimeout(() => setIsCapturing(true), 1000);
    }
  };

  const startPhotoSession = () => {
    setPhotos([]);
    setIsCapturing(true);
    toast.info('Get ready for your photo session! 📸', {
      position: 'top-center'
    });
  };

  const filters: Filter[] = [
    { name: 'normal', label: 'Normal', icon: '📷' },
    { name: 'pastel', label: 'Pastel', icon: '🌸' },
    { name: 'smooth', label: 'Smooth', icon: '✨' },
    { name: 'sparkle', label: 'Sparkle', icon: '⭐' },
  ];

  const downloadPhotos = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const photoWidth = 300;
    const photoHeight = 400;
    
    canvas.width = photoWidth * 2;
    canvas.height = photoHeight * 2;
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      Promise.all(photos.map((photo, index) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const x = (index % 2) * photoWidth;
            const y = Math.floor(index / 2) * photoHeight;
            ctx.drawImage(img, x, y, photoWidth, photoHeight);
            resolve();
          };
          img.src = photo.dataUrl;
        });
      })).then(() => {
        const link = document.createElement('a');
        link.download = 'photobooth-strip.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Photos downloaded successfully! 💾', {
          position: 'top-center'
        });
      });
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = 'Check out my awesome photo booth pictures! 📸';

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          recycle={false}
          numberOfPieces={200}
          tweenDuration={8000}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen p-8"
      >
      
        
        {photos.length < photosNeeded ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {filters.map(filter => (
                <motion.button
                  key={filter.name}
                  onClick={() => setSelectedFilter(filter.name)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`filter-button ${selectedFilter === filter.name ? 'bg-primary text-white' : ''}`}
                >
                  {filter.icon} {filter.label}
                </motion.button>
              ))}
            </div>
            
            <div className="relative">
              <WebcamCapture
                onPhotoCaptured={handlePhotoCaptured}
                isCountdownActive={isCapturing}
                countdownDuration={3}
                selectedFilter={selectedFilter}
              />
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <motion.button
                className="btn-primary"
                onClick={startPhotoSession}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                {photos.length === 0 ? 'Start Photo Session' : 'Retake Photos'}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative w-[300px] h-[400px] mx-auto mb-6">
              {photos.map((photo, index) => {
                const offset = (photos.length - 1 - index) * -20;
                const rotation = (index - (photos.length - 1) / 2) * 5;
                return (
                  <motion.div
                    key={photo.id}
                    className="photo-frame absolute top-0 left-0"
                    style={{
                      zIndex: index + 1,
                      transform: `translate(${offset}px, ${offset}px) rotate(${rotation}deg)`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <motion.button
                className="btn-primary"
                onClick={startPhotoSession}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Take New Photos
              </motion.button>
              
              <motion.button
                className="btn-primary"
                onClick={downloadPhotos}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Save Photos
              </motion.button>
              
              <motion.button
                className="btn-primary"
                onClick={() => setIsShareModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShareIcon className="w-5 h-5 mr-2" />
                Share Photos
              </motion.button>
            </div>
          </motion.div>
        )}
        
        <motion.div className="photo-grid mt-8">
          {Array.from({ length: photosNeeded }).map((_, index) => (
            <motion.div
              key={index}
              className={`photo-frame ${index >= photos.length ? 'bg-white/20' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {index >= photos.length && (
                <motion.div
                  className="h-full flex items-center justify-center text-white/60 text-lg font-medium"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Photo {index + 1}
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
      />
      
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default App;
