import React from 'react';
import { QuizResult } from '../types';

interface Props {
  result: QuizResult;
  onRestart: () => void;
  onViewDashboard: () => void;
  isPro: boolean;
}

const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);
const CrossIcon = () => (
    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);

const ScoreScreen: React.FC<Props> = ({ result, onRestart, onViewDashboard, isPro }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Complete!</h1>
        <p className="text-lg text-gray-600 mb-4">You scored</p>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <p className={`text-6xl font-bold ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage}%</p>
        </div>
        <p className="text-2xl text-gray-500">
            ({result.score} out of {result.totalQuestions} correct)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Answers</h2>
        <div className="space-y-6">
          {result.userAnswers.map((ua, index) => {
            const isCorrect = ua.userAnswer === ua.answer;
            return (
                 <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="font-semibold text-gray-800 text-lg">{index + 1}. {ua.question}</p>
                    <div className={`mt-2 flex items-start ${isCorrect ? 'text-gray-700' : 'text-red-700'}`}>
                        {isCorrect ? <CheckIcon /> : <CrossIcon />}
                        <p><span className="font-semibold">Your answer:</span> {ua.userAnswer}</p>
                    </div>
                    {!isCorrect && (
                        <div className="mt-1 flex items-start text-green-700">
                            <CheckIcon />
                            <p><span className="font-semibold">Correct answer:</span> {ua.answer}</p>
                        </div>
                    )}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                        <p><span className="font-semibold">Explanation:</span> {ua.explanation}</p>
                    </div>
                </div>
            )
          })}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button onClick={onRestart} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg">
          Take Another Exam
        </button>
        {isPro && (
            <button onClick={onViewDashboard} className="w-full sm:w-auto bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-lg">
                View Dashboard
            </button>
        )}
      </div>
    </div>
  );
};

export default ScoreScreen;
