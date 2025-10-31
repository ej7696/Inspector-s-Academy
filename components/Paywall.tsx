import React from 'react';

const Paywall: React.FC = () => {
  return (
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Limit Reached</h2>
      <p className="text-lg text-gray-600 mb-8">
        You've taken 3 quizzes. Please upgrade to continue generating more quizzes.
      </p>
      <button
        onClick={() => alert('Upgrade functionality not implemented yet!')}
        className="py-3 px-6 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Upgrade Now
      </button>
    </div>
  );
};

export default Paywall;
