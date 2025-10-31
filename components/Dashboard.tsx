import React, { useMemo } from 'react';
import { QuizResult } from '../types';

interface DashboardProps {
  history: QuizResult[];
  onGoBack: () => void;
  onStartTargetedQuiz: (topic: string, numQuestions: number, isTimed: boolean, weakTopics: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, onGoBack, onStartTargetedQuiz }) => {

  const weakTopics = useMemo(() => {
    if (history.length === 0) return [];

    const topicStats: { [key: string]: { correct: number, total: number } } = {};

    history.forEach(result => {
      result.userAnswers.forEach(ua => {
        const category = ua.category;
        if (!topicStats[category]) {
          topicStats[category] = { correct: 0, total: 0 };
        }
        topicStats[category].total++;
        if (ua.userAnswer === ua.answer) {
          topicStats[category].correct++;
        }
      });
    });
    
    return Object.entries(topicStats)
      .map(([category, stats]) => ({
        category,
        percentage: (stats.correct / stats.total) * 100,
        total: stats.total
      }))
      .filter(item => item.percentage < 70 && item.total > 2) // Considered weak if score < 70% and at least 3 questions seen
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3); // Top 3 weakest topics

  }, [history]);

  const handleStartWeaknessQuiz = () => {
    const topicNames = weakTopics.map(t => t.category);
    onStartTargetedQuiz("Targeted Practice", 10, false, topicNames);
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Performance Dashboard</h2>
        <button onClick={onGoBack} className="text-indigo-600 hover:text-indigo-800 font-semibold">
          &larr; Back to Home
        </button>
      </div>

      {/* Weakness Analysis Section */}
      {history.length > 0 && (
         <div className="mb-10 p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">AI-Powered Weakness Analysis</h3>
            {weakTopics.length > 0 ? (
                <>
                    <p className="text-gray-600 mb-5">Based on your history, here are your top areas for improvement:</p>
                    <div className="space-y-3 mb-6">
                        {weakTopics.map(topic => (
                            <div key={topic.category} className="p-3 bg-white rounded-md shadow-sm">
                                <p className="font-semibold text-gray-700">{topic.category}</p>
                                <p className="text-sm text-red-600">Accuracy: {topic.percentage.toFixed(0)}%</p>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={handleStartWeaknessQuiz}
                        className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Start a 10-Question Quiz on These Topics
                    </button>
                </>
            ) : (
                <p className="text-gray-600">
                    Keep taking quizzes to unlock your personalized weakness analysis! We need a bit more data to identify your areas for improvement.
                </p>
            )}
        </div>
      )}
     

      {/* Exam History Section */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Exam History</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.slice().reverse().map(result => (
              <div key={result.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{result.examName}</p>
                  <p className="text-sm text-gray-500">{new Date(result.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className={`font-bold text-xl ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.percentage}%
                  </p>
                  <p className="text-sm text-gray-600 text-right">{result.score}/{result.totalQuestions}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You haven't completed any exams yet.</p>
            <p className="text-sm text-gray-500 mt-2">Your results will appear here once you finish a quiz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
