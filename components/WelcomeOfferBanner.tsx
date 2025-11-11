import React from 'react';

interface Props {
  onUpgrade: () => void;
}

const WelcomeOfferBanner: React.FC<Props> = ({ onUpgrade }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-lg shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="text-3xl">🎉</div>
        <div>
          <h3 className="font-bold text-lg">Welcome Offer!</h3>
          <p className="text-sm">Upgrade within 48 hours of signup and get 20% off your first Professional plan.</p>
        </div>
      </div>
      <button 
        onClick={onUpgrade}
        className="bg-white text-indigo-700 font-bold px-6 py-2 rounded-md hover:bg-indigo-100 transition-colors flex-shrink-0"
      >
        Upgrade Now
      </button>
    </div>
  );
};

export default WelcomeOfferBanner;