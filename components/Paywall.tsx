import React from 'react';

interface PaywallProps {
  onUpgrade: () => void;
}

const ProFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-center">
        <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-gray-700">{children}</span>
    </li>
);

const Paywall: React.FC<PaywallProps> = ({ onUpgrade }) => {
  return (
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Free Limit Reached</h2>
      <p className="text-lg text-gray-600 mb-8">
        You've taken your 3 free quizzes. Upgrade to Pro to unlock your full potential!
      </p>
      
      <div className="my-8 text-left inline-block p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Unlock Pro Features:</h3>
          <ul className="space-y-3">
              <ProFeature>Unlimited Quiz Generation</ProFeature>
              <ProFeature>Full Performance Dashboard & History</ProFeature>
              <ProFeature>AI-Powered Weakness Analysis</ProFeature>
              <ProFeature>"Ask a Follow-up" AI Tutor</ProFeature>
              <ProFeature>Timed Exam Mode</ProFeature>
          </ul>
      </div>

      <div className="mt-6">
        <button
            onClick={onUpgrade}
            className="py-3 px-8 bg-green-600 text-white font-bold rounded-md shadow-lg hover:bg-green-700 transform hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
            Upgrade Now & Unlock All Features
        </button>
      </div>
    </div>
  );
};

export default Paywall;
