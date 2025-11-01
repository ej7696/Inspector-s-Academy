import React from 'react';

interface Props {
  onUpgrade: () => void;
  onCancel: () => void;
}

const Paywall: React.FC<Props> = ({ onUpgrade, onCancel }) => {
  const proFeatures = [
    "Unlimited Quizzes & Questions",
    "Full Performance Dashboard & History",
    "AI-Powered Weakness Analysis",
    "Targeted Practice Quizzes",
    "'Ask a Follow-up' AI Tutor",
    "Timed Exam Mode"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center transform transition-all animate-fade-in-up">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Upgrade to Inspector Pro!</h2>
        <p className="text-gray-600 mb-6">
          Unlock your full potential and gain access to our most powerful study tools.
        </p>

        <ul className="text-left space-y-2 mb-8">
            {proFeatures.map(feature => (
                 <li key={feature} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        
        <button 
          className="w-full bg-green-500 text-white p-3 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors"
          onClick={onUpgrade}
        >
          Upgrade Now & Unlock All Features
        </button>
        <button 
          className="mt-4 text-sm text-gray-500 hover:underline"
          onClick={onCancel}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default Paywall;
