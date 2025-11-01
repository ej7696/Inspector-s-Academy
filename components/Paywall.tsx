import React from 'react';

interface Props {
  onUpgrade: () => void;
}

const Paywall: React.FC<Props> = ({ onUpgrade }) => {

  const CheckIcon = () => (
    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
  );

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Unlock Your Full Potential</h2>
      <p className="text-gray-600 mb-8">
        Upgrade to the Pro Tier to access powerful features designed to help you ace your certification exam.
      </p>

      <div className="text-left space-y-4 mb-8">
        <div className="flex items-center">
          <CheckIcon />
          <span><span className="font-semibold">Unlimited Quizzes:</span> Generate as many mock exams as you need.</span>
        </div>
        <div className="flex items-center">
          <CheckIcon />
          <span><span className="font-semibold">Performance Dashboard:</span> Track your progress and review your entire exam history.</span>
        </div>
        <div className="flex items-center">
          <CheckIcon />
          <span><span className="font-semibold">AI Weakness Analysis:</span> Automatically identify and focus on your weakest topics.</span>
        </div>
        <div className="flex items-center">
          <CheckIcon />
          <span><span className="font-semibold">Targeted Practice Quizzes:</span> Generate exams specifically on your weak areas.</span>
        </div>
        <div className="flex items-center">
          <CheckIcon />
          <span><span className="font-semibold">AI Follow-Up Questions:</span> Ask for clarification on any explanation and get instant answers.</span>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md"
      >
        Upgrade Now & Go Pro
      </button>
    </div>
  );
};

export default Paywall;
