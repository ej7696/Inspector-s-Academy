import React from 'react';
import { UserAnswer } from '../types';

interface ScoreScreenProps {
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

const ScoreScreen: React.FC<ScoreScreenProps> = ({ userAnswers, onRestart }) => {
  const score = userAnswers.filter(ua => ua.userAnswer === ua.answer).length;
  const total = userAnswers.length;

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
      <p className="text-xl text-gray-600 mb-8">
        Your Score: <span className="font-bold text-indigo-600">{score}</span> / {total}
      </p>

      <div className="space-y-6 text-left mb-8">
        {userAnswers.map((ua, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <p className="font-semibold" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${ua.question}` }} />
            <p className={`mt-2 ${ua.userAnswer === ua.answer ? 'text-green-600' : 'text-red-600'}`}>
              Your answer: {ua.userAnswer}
            </p>
            {ua.userAnswer !== ua.answer && (
              <p className="mt-1 text-green-600">Correct answer: {ua.answer}</p>
            )}
            <p className="mt-2 text-sm text-gray-700 italic">
              <strong>Explanation:</strong> {ua.explanation}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Take Another Quiz
      </button>
    </div>
  );
};

export default ScoreScreen;
