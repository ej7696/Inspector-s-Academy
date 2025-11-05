import React, { useMemo } from 'react';
import { QuizResult } from '../types';

interface Props {
  result: QuizResult;
  onRestart: () => void;
  onGoHome: () => void;
  isPro: boolean;
  onViewDashboard: () => void;
  onRegenerate: () => void;
}

const ScoreScreen: React.FC<Props> = ({ result, onRestart, onGoHome, isPro, onViewDashboard, onRegenerate }) => {
  const scoreColor = result.percentage >= 70 ? 'text-green-600' : 'text-red-600';

  const topicPerformance = useMemo(() => {
    const statsByCategory: { [key: string]: { correct: number; total: number } } = {};

    result.userAnswers.forEach(ua => {
      const category = ua.category || 'Uncategorized';
      if (!statsByCategory[category]) {
        statsByCategory[category] = { correct: 0, total: 0 };
      }
      statsByCategory[category].total++;
      if (ua.isCorrect) {
        statsByCategory[category].correct++;
      }
    });

    return Object.entries(statsByCategory).map(([category, stats]) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      let status = '';
      if (accuracy >= 70) {
        status = '✅ Strong';
      } else if (accuracy >= 40) {
        status = '⚠️ Review';
      } else {
        status = '❌ Weak';
      }
      return {
        category,
        correctCount: stats.correct,
        incorrectCount: stats.total - stats.correct,
        accuracy,
        status,
      };
    }).sort((a, b) => b.incorrectCount - a.incorrectCount);
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl">
      <div className="text-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
        <p className="text-gray-600 mb-6">Here's how you did on the "{result.examName}" exam.</p>
        
        <div className="mb-8">
          <p className="text-lg text-gray-700">Your Score:</p>
          <p className={`text-6xl font-bold ${scoreColor}`}>{result.percentage.toFixed(1)}%</p>
          <p className="text-gray-500 mt-2">({result.score} out of {result.totalQuestions} correct)</p>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <button 
            onClick={onRestart}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
          >
            Try This Quiz Again
          </button>
          {isPro && (
             <button 
                onClick={onViewDashboard}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors"
            >
                View Performance Dashboard
            </button>
          )}
          <button 
            onClick={onGoHome}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
        {isPro && (
            <button
                onClick={onRegenerate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-lg transition-colors mt-6"
            >
                🔁 Regenerate Exam (120 New Questions)
            </button>
        )}
      </div>

      {/* Topic Breakdown Section */}
      {topicPerformance.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Topic Breakdown</h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incorrect</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topicPerformance.map((topic) => (
                  <tr key={topic.category}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{topic.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">{topic.correctCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">{topic.incorrectCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{topic.accuracy.toFixed(0)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{topic.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Review Your Answers</h2>
        <ul className="space-y-4">
          {result.userAnswers.map((ua, index) => (
            <li key={index} className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">{index + 1}. {ua.question}</p>
              <p className={`font-medium ${ua.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                Your answer: {ua.userAnswer} {ua.isCorrect ? ' (Correct)' : ' (Incorrect)'}
              </p>
              {!ua.isCorrect && (
                <p className="font-medium text-green-700">Correct answer: {ua.answer}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default ScoreScreen;