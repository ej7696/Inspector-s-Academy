import React from 'react';

interface QuizCompleteScreenProps {
  onRestart: () => void;
}

const QuizCompleteScreen: React.FC<QuizCompleteScreenProps> = ({ onRestart }) => {
  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Exam Finished!</h2>
      <p className="text-xl text-gray-600 mb-8">
        You have completed all the questions. Great work!
      </p>
      <button
        onClick={onRestart}
        className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Take Another Exam
      </button>
    </div>
  );
};

export default QuizCompleteScreen;
