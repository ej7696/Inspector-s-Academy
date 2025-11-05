import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, QuizResult } from '../types';
import ProgressRing from './ProgressRing';

interface Props {
  user: User;
  onGoHome: () => void;
  onStartWeaknessQuiz: (topics: string) => void;
  onUpgrade: () => void;
}

const Dashboard: React.FC<Props> = ({ user, onGoHome, onStartWeaknessQuiz, onUpgrade }) => {
  switch (user.subscriptionTier) {
    case 'PROFESSIONAL':
      return <ProfessionalDashboard user={user} onGoHome={onGoHome} onStartWeaknessQuiz={onStartWeaknessQuiz} />;
    case 'SPECIALIST':
      return <SpecialistDashboard user={user} onGoHome={onGoHome} onStartWeaknessQuiz={onStartWeaknessQuiz} />;
    case 'STARTER':
    default:
      return <CadetDashboard user={user} onGoHome={onGoHome} onUpgrade={onUpgrade} />;
  }
};

// --- Cadet Dashboard ---
const CadetDashboard: React.FC<{ user: User, onGoHome: () => void, onUpgrade: () => void }> = ({ user, onGoHome, onUpgrade }) => {
    const totalQuestionsAnswered = useMemo(() => {
        return user.history.reduce((acc, result) => acc + result.totalQuestions, 0);
    }, [user.history]);

    const bestScore = useMemo(() => {
        if (user.history.length === 0) return 0;
        return Math.max(...user.history.map(h => h.percentage));
    }, [user.history]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Your Starting Point</h1>
                 <button onClick={onGoHome} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Start Your First Practice Quiz
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Total Questions Answered" value={totalQuestionsAnswered.toString()} />
                <StatCard title="Best Score So Far" value={`${bestScore.toFixed(1)}%`} />
            </div>

            <div className="relative bg-white border border-gray-200 rounded-lg p-6 shadow-md text-center">
                <div className="filter blur-sm pointer-events-none">
                     <h2 className="text-2xl font-bold text-gray-400 mb-4">Performance Analytics</h2>
                     <p className="text-gray-400">Track your progress, pinpoint weaknesses, and review unlimited history.</p>
                     <div className="h-40 w-full bg-gray-200 mt-4 rounded-md"></div>
                </div>
                <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center p-4">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Unlock Your Performance Analytics</h3>
                    <p className="text-gray-600 mb-4 max-w-md">Upgrade to a paid plan to unlock weakness analysis, performance trend charts, and unlimited quiz history.</p>
                    <button onClick={onUpgrade} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                        View Upgrade Options
                    </button>
                </div>
            </div>

            <div className="mt-8">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Last 3 Attempts</h2>
                 {user.history.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 bg-white rounded-lg shadow-md">You haven't completed any quizzes yet.</p>
                 ) : (
                    <div className="bg-white rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200">
                            {user.history.slice(-3).reverse().map(result => (
                                <li key={result.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{result.examName}</p>
                                        <p className="text-sm text-gray-500">{new Date(result.date).toLocaleString()}</p>
                                    </div>
                                    <p className={`font-bold text-xl ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage.toFixed(1)}%</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
            </div>
        </div>
    );
};

// --- Professional Dashboard ---
const ProfessionalDashboard: React.FC<{ user: User, onGoHome: () => void, onStartWeaknessQuiz: (topics: string) => void }> = ({ user, onGoHome, onStartWeaknessQuiz }) => {
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    
    const unlockedExam = user.unlockedExams[0] || "Your Exam";
    const examHistory = useMemo(() => user.history.filter(h => user.unlockedExams.includes(h.examName)), [user.history, user.unlockedExams]);
    
    const filteredExamHistory = useMemo(() => {
        return examHistory.filter(h => 
            h.examName.toLowerCase().includes(historySearchTerm.toLowerCase())
        );
    }, [examHistory, historySearchTerm]);

    const readinessScore = useMemo(() => {
        if (examHistory.length === 0) return 0;
        const avgScore = examHistory.reduce((acc, h) => acc + h.percentage, 0) / examHistory.length;
        const recentHistory = examHistory.slice(-5);
        const mostRecentScore = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].percentage : avgScore;
        // Give more weight to the most recent score
        return (avgScore * 0.4) + (mostRecentScore * 0.6);
    }, [examHistory]);

    const weaknessAnalysis = useMemo(() => {
        const categoryStats: { [key: string]: { correct: number; total: number } } = {};
        examHistory.forEach(result => {
          result.userAnswers.forEach(ua => {
            const category = ua.category || 'Uncategorized';
            if (!categoryStats[category]) categoryStats[category] = { correct: 0, total: 0 };
            categoryStats[category].total++;
            if (ua.isCorrect) categoryStats[category].correct++;
          });
        });

        return Object.entries(categoryStats)
            .map(([category, stats]) => ({ category, accuracy: (stats.correct / stats.total) * 100, total: stats.total }))
            .filter(c => c.total >= 3) // Only show topics with at least 3 questions
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5); // Top 5 weakest
    }, [examHistory]);

     const performanceTrend = useMemo(() => {
        const examSpecificHistory = examHistory.filter(h => h.examName === unlockedExam);
        if (examSpecificHistory.length < 2) return null;
        return {
            labels: examSpecificHistory.map(r => new Date(r.date).toLocaleDateString()),
            scores: examSpecificHistory.map(r => r.percentage)
        };
    }, [examHistory, unlockedExam]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Exam Command Center</h1>
                    <p className="text-gray-500">Welcome back, {user.fullName || user.email}! You are <span className="font-semibold">{readinessScore.toFixed(0)}%</span> ready for the {unlockedExam} exam. Let's close the gap.</p>
                </div>
                 <button onClick={onGoHome} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    &larr; Back to Home
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Exam Readiness: {unlockedExam}</h2>
                        <ProgressRing score={readinessScore} />
                        <p className="text-sm text-gray-500 mt-2">A smart score based on your recent performance and average.</p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Actionable Weakness Analysis</h2>
                        {weaknessAnalysis.length > 0 ? (
                            <ul className="space-y-3">
                                {weaknessAnalysis.map(({category, accuracy}) => (
                                    <li key={category}>
                                        <button onClick={() => onStartWeaknessQuiz(category)} className="w-full text-left p-3 bg-red-50 rounded-lg hover:bg-red-100 transition">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-red-800">{category}</span>
                                                <span className="font-bold text-red-600">{accuracy.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
                                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${accuracy}%`}}></div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-sm text-gray-500">Complete more quizzes to identify your weak areas.</p>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     {performanceTrend && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                             <h3 className="text-lg font-semibold text-gray-700 mb-2">Performance Trend: {unlockedExam}</h3>
                             <LineChart data={performanceTrend} />
                        </div>
                     )}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Full Quiz History</h3>
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={historySearchTerm}
                                onChange={e => setHistorySearchTerm(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                        <HistoryTable history={filteredExamHistory} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Specialist Dashboard ---
const SpecialistDashboard: React.FC<{ user: User, onGoHome: () => void, onStartWeaknessQuiz: (topics: string) => void }> = ({ user, onGoHome, onStartWeaknessQuiz }) => {
    const [historyFilter, setHistoryFilter] = useState('All');

    const filteredHistory = useMemo(() => {
        if (historyFilter === 'All') return user.history;
        return user.history.filter(h => h.examName === historyFilter);
    }, [user.history, historyFilter]);

    const readinessScores = useMemo(() => {
        return user.unlockedExams.map(examName => {
            const examHistory = user.history.filter(h => h.examName === examName);
            if (examHistory.length === 0) return { examName, score: 0 };
            const avgScore = examHistory.reduce((acc, h) => acc + h.percentage, 0) / examHistory.length;
            const mostRecentScore = examHistory.sort((a,b) => b.date - a.date)[0].percentage;
            return { examName, score: (avgScore * 0.4) + (mostRecentScore * 0.6) };
        });
    }, [user.history, user.unlockedExams]);

    const crossExamWeakness = useMemo(() => {
        const categoryStats: { [key: string]: { correct: number; total: number, exams: Set<string> } } = {};
        user.history.forEach(result => {
          result.userAnswers.forEach(ua => {
            const category = ua.category || 'Uncategorized';
            if (!categoryStats[category]) categoryStats[category] = { correct: 0, total: 0, exams: new Set() };
            categoryStats[category].total++;
            if (ua.isCorrect) categoryStats[category].correct++;
            categoryStats[category].exams.add(result.examName);
          });
        });

        return Object.entries(categoryStats)
            .map(([category, stats]) => ({ category, accuracy: (stats.correct / stats.total) * 100, total: stats.total, examCount: stats.exams.size }))
            .filter(c => c.total >= 5 && c.examCount > 1) // Weakness appears in more than 1 exam
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 3); // Top 3 cross-exam weaknesses
    }, [user.history]);

    const smartRecommendation = useMemo(() => {
        if (readinessScores.length < 2) return "Unlock another exam to get strategic recommendations.";
        const sorted = [...readinessScores].sort((a,b) => a.score - b.score);
        if (sorted[0].score < 85) {
            return `Your readiness for ${sorted[0].examName} is lowest. We recommend focusing there to close the gap.`;
        }
        return `You're showing strong readiness across the board! Keep up the great work.`;
    }, [readinessScores]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Expertise Portfolio</h1>
                    <p className="text-gray-500">Welcome, Specialist {user.fullName || user.email}!</p>
                </div>
                 <button onClick={onGoHome} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    &larr; Back to Home
                </button>
            </div>

            <div className="space-y-8">
                {/* Mastery Overview */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Mastery Overview</h2>
                    {user.unlockedExams.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {readinessScores.map(({examName, score}) => (
                                <div key={examName} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2 truncate" title={examName}>{examName}</h3>
                                    <ProgressRing score={score} />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-4">Unlock an exam to see your mastery overview.</p>
                    )}
                     <div className="text-right text-sm text-gray-500 mt-4">
                        Slots Used: {user.unlockedExams.length} / 2 | <a href="#" onClick={(e) => { e.preventDefault(); onGoHome(); }} className="text-blue-600 hover:underline">Unlock More</a>
                    </div>
                </div>

                {/* Smart Recommendations & Cross-Exam Weakness */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {smartRecommendation && (
                         <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                             <h2 className="text-xl font-semibold text-gray-700 mb-2">Smart Recommendation</h2>
                             <p className="text-gray-600">{smartRecommendation}</p>
                         </div>
                    )}
                    {crossExamWeakness.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                             <h2 className="text-xl font-semibold text-gray-700 mb-2">Cross-Exam Weakness Analysis</h2>
                             <p className="text-sm text-gray-500 mb-3">Topics you struggle with across multiple certifications.</p>
                             <ul className="space-y-2">
                                 {crossExamWeakness.map(({category, accuracy}) => (
                                     <li key={category}>
                                         <button onClick={() => onStartWeaknessQuiz(category)} className="w-full text-left p-2 bg-red-50 rounded-lg hover:bg-red-100 transition">
                                            <div className="flex justify-between items-center font-semibold text-red-800">
                                                <span>{category}</span>
                                                <span>{accuracy.toFixed(0)}%</span>
                                            </div>
                                         </button>
                                     </li>
                                 ))}
                             </ul>
                        </div>
                    )}
                 </div>

                {/* Filterable History */}
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Consolidated Quiz History</h2>
                        <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md">
                            <option value="All">All Exams</option>
                            {user.unlockedExams.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <HistoryTable history={filteredHistory} />
                </div>
            </div>
        </div>
    );
};

// --- Shared Components for Dashboards ---

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
);

const LineChart: React.FC<{ data: { labels: string[], scores: number[] } }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && data.labels.length > 1 && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Scores',
                            data: data.scores,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            tension: 0.1
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score (%)' } } }, plugins: { legend: { display: false } } }
                });
            }
        }
    }, [data]);
    
    if (data.labels.length <= 1) return null;

    return <canvas ref={chartRef}></canvas>;
};

const HistoryTable: React.FC<{ history: QuizResult[] }> = ({ history }) => {
    if (history.length === 0) {
        return <div className="text-center py-10"><p className="text-gray-500">No quiz history to display for this selection.</p></div>;
    }
    return (
        <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.slice().reverse().map((result) => (
                            <tr key={result.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><p className="font-semibold text-gray-800">{result.examName}</p></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(result.date).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <p className={`font-bold text-lg ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-500">{result.score}/{result.totalQuestions}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default Dashboard;