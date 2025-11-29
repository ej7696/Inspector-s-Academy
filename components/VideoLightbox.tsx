import React, { useEffect } from 'react';

interface Props {
  videoSrc: string;
  onClose: () => void;
}

const VideoLightbox: React.FC<Props> = ({ videoSrc, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          className="w-full h-full rounded-lg"
          src={videoSrc}
          controls
          autoPlay
          playsInline
        >
          Your browser does not support the video tag.
        </video>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full text-black text-2xl font-bold flex items-center justify-center"
          aria-label="Close video"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default VideoLightbox;