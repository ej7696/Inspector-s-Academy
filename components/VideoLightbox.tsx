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

  /* 
    VIDEO SCRIPT - "Pass with Confidence" (60 Seconds)

    VISUAL STYLE: Clean, modern motion graphics mixed with animated screen recordings.
    MUSIC: Upbeat, inspiring, and modern corporate track.
    VOICEOVER (VO): Clear, confident, and trustworthy voice.

    --- SCRIPT ---

    [0-5s]
    VISUAL: Fast cuts. A hand flipping through a massive, highlighted code book. A stressed-looking person at a desk late at night. A static, boring PDF of old exam questions.
    ON-SCREEN TEXT: "Outdated PDFs?" "Endless Memorization?"
    VO: (Music starts, upbeat and driving) Are you tired of studying for your certification the hard way?

    [5-10s]
    VISUAL: The screen "glitches" and transitions to a clean, animated background. Your logo animates into the center.
    ON-SCREEN TEXT: Inspector's Academy
    VO: What if there was a smarter way to prepare?

    [10-20s]
    VISUAL: Animated screen recording. The user selects "API 510". Questions dynamically appear, each one different. A glowing icon pulses next to the questions.
    ON-SCREEN TEXT: Dynamic Question Engine
    VO: Introducing Inspector's Academy, featuring our exclusive Smart Generation technology that builds a unique, exam-caliber quiz for you, every time.

    [20-28s]
    VISUAL: Split screen. On the left, a "Closed Book" session with a timer. On the right, an "Open Book" session. The visuals feel intense.
    ON-SCREEN TEXT: Realistic Exam Simulations
    VO: Go beyond simple practice. Our timed Simulation Mode replicates the pressure of the real exam, testing your knowledge and your ability to navigate the code books.

    [28-38s]
    VISUAL: Animated screen recording of the Dashboard. A bar chart animates, showing "Weakness Analysis".
    ON-SCREEN TEXT: Find & Fix Your Weaknesses
    VO: Stop guessing where you're weak. Our Performance Dashboard instantly analyzes your results, pinpoints your exact knowledge gaps...

    [38-45s]
    VISUAL: The screen recording shows the user starting a new "Weakness Quiz". The questions are all clearly on one topic.
    ON-SCREEN TEXT: Targeted Practice
    VO: ...and lets you launch a targeted quiz to turn those weak spots into strengths.

    [45-53s]
    VISUAL: Fast, clean animations. A quote from a testimonial appears next to a professional headshot. Logos for API, AWS, CWI flash on screen.
    ON-SCREEN TEXT: "A total game-changer!" - John D., API 510 Certified
    VO: Join hundreds of inspectors who have used our platform to walk into their exam with total confidence.

    [53-60s]
    VISUAL: The screen resolves to a clean, final shot. Your logo is prominent. A large, animated button appears. Music hits a final chord.
    ON-SCREEN TEXT: Inspector's Academy [Start Practicing for Free]
    VO: Stop memorizing. Start mastering. Click the button to start practicing for free, right now.
  */

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
