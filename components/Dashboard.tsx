import React, { useMemo, useEffect, useRef } from 'react';
import { QuizResult } from '../types';

interface Props {
  history: QuizResult[];
  onGoHome: () => void;
  onStartWeaknessQuiz: (topics: string) => void;
}

// Chart component for visualizing weakness analysis as a horizontal bar chart
const WeaknessChart: React.FC<{ data: any[] }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current && data.length > 0 && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.category),
                        datasets: [{
                            label: 'Accuracy',
                            data: data.map(d => d.accuracy),
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: 'Accuracy (%)' } } },
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (c: any) => `Accuracy: ${c.raw.toFixed(1)}%` } }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [data]);

    return <canvas ref={chartRef}></canvas>;
};

// Chart component for visualizing performance trends over time as a line chart
const PerformanceTrendChart: React.FC<{ data: any, examName: string }> = ({ data, examName }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current && data.labels.length > 1 && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: `Scores for ${examName}`,
                            data: data.scores,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [data, examName]);

    if (data.labels.length <= 1) {
        return <p className="text-center text-gray-500 text-sm py-4">Complete at least two quizzes of the same type to see your performance trend.</p>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Performance Trend: {examName}</h3>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};


const Dashboard: React.FC<Props> = ({ history, onGoHome, onStartWeaknessQuiz }) => {
    
  const weaknessAnalysis = useMemo(() => {
    if (history.length === 0) return null;
    const categoryStats: { [key: string]: { correct: number; total: number } } = {};
    history.forEach(result => {
      // Ensure userAnswers exists and is an array before processing
      if (result.userAnswers && Array.isArray(result.userAnswers)) {
          result.userAnswers.forEach(ua => {
            const category = ua.category || 'Uncategorized';
            if (!categoryStats[category]) categoryStats[category] = { correct: 0, total: 0 };
            categoryStats[category].total++;
            if (ua.userAnswer === ua.answer) categoryStats[category].correct++;
          });
      }
    });

    const categoriesWithAccuracy = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      accuracy: (stats.correct / stats.total) * 100,
      total: stats.total,
    }));

    const weakAreas = categoriesWithAccuracy
      .filter(c => c.total >= 5 && c.accuracy < 75)
      .sort((a, b) => a.accuracy - b.accuracy);

    return { weakestTopics: weakAreas.slice(0, 5) };
  }, [history]);

  const performanceTrend = useMemo(() => {
    if (history.length < 2) return null;
    const examCounts = history.reduce((acc, result) => {
        acc[result.examName] = (acc[result.examName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (Object.keys(examCounts).length === 0) return null;

    const mostFrequentExam = Object.keys(examCounts).reduce((a, b) => examCounts[a] > examCounts[b] ? a : b);
    const trendData = history.filter(r => r.examName === mostFrequentExam).sort((a, b) => a.date - b.date);
    
    return {
        examName: mostFrequentExam,
        data: {
            labels: trendData.map(r => new Date(r.date).toLocaleDateString()),
            scores: trendData.map(r => r.percentage)
        }
    };
  }, [history]);

  const handleWeaknessQuiz = () => {
      if (weaknessAnalysis && weaknessAnalysis.weakestTopics.length > 0) {
          const topics = weaknessAnalysis.weakestTopics.map(t => t.category).join(', ');
          onStartWeaknessQuiz(topics);
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Performance Dashboard</h1>
        <button onClick={onGoHome} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors self-start sm:self-center">
          &larr; Back to Home
        </button>
      </div>

      {weaknessAnalysis && weaknessAnalysis.weakestTopics.length > 0 && (
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-md">
           <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Weakest Areas</h2>
           <p className="text-gray-600 mb-4">This chart shows your accuracy on topics where you've answered 5+ questions with less than 75% accuracy.</p>
           <div className="mb-5">
              <WeaknessChart data={weaknessAnalysis.weakestTopics} />
           </div>
           <button 
              onClick={handleWeaknessQuiz}
              className="w-full bg-yellow-500 text-white p-3 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors"
           >
             Start a 10-Question Quiz on These Topics
           </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz History</h2>
        {history.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">You haven't completed any quizzes yet.</p>
            <p className="text-gray-500 mt-2">Your completed quiz results will appear here.</p>
          </div>
        ) : (
          <>
            {performanceTrend && <PerformanceTrendChart data={performanceTrend.data} examName={performanceTrend.examName} />}
            <div className="bg-white rounded-lg shadow-md">
              <ul className="divide-y divide-gray-200">
                {history.map((result) => (
                  <li key={result.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex-grow">
                      <p className="font-semibold text-lg text-gray-800">{result.examName}</p>
                      <p className="text-sm text-gray-500">{new Date(result.date).toLocaleString()}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`font-bold text-2xl ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage}%</p>
                      <p className="text-sm text-gray-500">{result.score}/{result.totalQuestions} correct</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
