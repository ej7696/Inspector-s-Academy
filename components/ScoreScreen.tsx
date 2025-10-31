import React from 'react';
import { UserAnswer } from '../types';

interface ScoreScreenProps {
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

// Icon components for visual feedback in the review
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 inline-block mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CrossIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 inline-block mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const ScoreScreen: React.FC<ScoreScreenProps> = ({ userAnswers, onRestart }) => {
  const score = userAnswers.filter(ua => ua.userAnswer === ua.answer).length;
  const totalQuestions = userAnswers.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="py-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Exam Results</h2>
        <p className="text-xl text-gray-600 mb-6">
          You have completed the exam. Here's how you did:
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 inline-block shadow-sm border">
          <p className="text-lg text-gray-700">You scored</p>
          <p className={`text-6xl font-bold my-2 ${getScoreColor()}`}>{percentage}%</p>
          <p className="text-md text-gray-600">
            That's <span className="font-semibold">{score}</span> out of <span className="font-semibold">{totalQuestions}</span> questions correct.
          </p>
        </div>
      </div>

      <div className="my-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-left">Review Your Answers</h3>
          <div className="space-y-6 text-left">
              {userAnswers.map((ua, index) => {
                  const isCorrect = ua.userAnswer === ua.answer;
                  return (
                      <div key={index} className="border-b border-gray-200 pb-4">
                          <p className="font-semibold text-gray-800 mb-3" dangerouslySetInnerHTML={{ __html: `Q${index + 1}: ${ua.question}` }} />
                          <div className={`flex items-center p-2 rounded text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {isCorrect ? <CheckIcon/> : <CrossIcon/>}
                            <span>Your answer: {ua.userAnswer}</span>
                          </div>
                          {!isCorrect && (
                              <div className="mt-2 p-2 rounded bg-gray-100 text-gray-700 text-sm">
                                  <span className="font-semibold mr-2">Correct answer:</span>
                                  <span>{ua.answer}</span>
                              </div>
                          )}
                      </div>
                  )
              })}
          </div>
      </div>
      
      <div className="text-center mt-10">
        <button
          onClick={onRestart}
          className="py-3 px-8 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Take Another Exam
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;