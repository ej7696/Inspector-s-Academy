import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = 'h-24 w-auto' }) => {
  return (
    <div className={`flex flex-col items-center group transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer ${className}`} style={{ fontFamily: 'sans-serif' }}>
      <svg 
        viewBox="0 0 120 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-labelledby="logoTitle"
      >
        <title id="logoTitle">Inspector's Academy Logo</title>
        <defs>
          <linearGradient id="silver-gradient-modern" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#E5E7EB', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#9CA3AF', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        
        {/* Shield */}
        <path d="M60 5 L10 25 L10 65 C10 85, 30 95, 60 95 C90 95, 110 85, 110 65 L110 25 Z" fill="#1E3A8A" />
        <path d="M60 5 L10 25 L10 65 C10 85, 30 95, 60 95 C90 95, 110 85, 110 65 L110 25 Z" stroke="url(#silver-gradient-modern)" strokeWidth="3" />

        {/* Magnifying Glass */}
        <g transform="translate(68, 48) rotate(45)">
            <circle cx="0" cy="0" r="14" fill="#F8FAFC" opacity="0.1" />
            <circle cx="0" cy="0" r="12" fill="none" stroke="url(#silver-gradient-modern)" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="22" y2="22" stroke="url(#silver-gradient-modern)" strokeWidth="4" strokeLinecap="round" />
        </g>
        
        {/* Gear */}
        <g transform="translate(52, 45) scale(0.6)" className="transition-transform duration-500 ease-in-out group-hover:rotate-45 origin-center">
            <path d="M0 -30 L5.2 -29.5 10 -28 14.5 -25 18 -21 21 -18 25 -14.5 28 -10 29.5 -5.2 30 0 29.5 5.2 28 10 25 14.5 21 18 18 21 14.5 25 10 28 5.2 29.5 0 30 -5.2 29.5 -10 28 -14.5 25 -18 21 -21 18 -25 14.5 -28 10 -29.5 5.2Z" fill="url(#silver-gradient-modern)" />
            <circle cx="0" cy="0" r="18" fill="#1E3A8A"/>
        </g>
      </svg>
      <div className="text-center mt-2 leading-none">
        <span className="font-bold text-gray-800" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.2em', letterSpacing: '0.05em' }}>
          INSPECTOR'S
        </span>
        <span className="font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8em', letterSpacing: '0.2em', display: 'block', marginTop: '2px' }}>
          ACADEMY
        </span>
      </div>
    </div>
  );
};

export default Logo;