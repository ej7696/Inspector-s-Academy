import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface Props {
    user: User;
    onStartQuiz: (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => void;
    onViewDashboard: () => void;
    onUpgrade: () => void;
    onResumeQuiz: () => void;
    onAbandonQuiz: () => void;
}

const allExams: { [key: string]: string[] } = {
    "API Certifications": [
        "API 510 - Pressure Vessel Inspector",
        "API 570 - Piping Inspector",
        "API 653 - Aboveground Storage Tank Inspector",
        "API 1169 - Pipeline Construction Inspector",
        "API 936 - Refractory Personnel",
    ],
    "SIFE/SIRE/SIEE Certifications": [
        "SIFE - Source Inspector Fixed Equipment",
        "SIRE - Source Inspector Rotating Equipment",
        "SIEE - Source Inspector Electrical Equipment",
    ],
    "AWS Certifications": [
        "CWI - Certified Welding Inspector",
    ]
};

const HomePage: React.FC<Props> = ({ user, onStartQuiz, onViewDashboard, onUpgrade, onResumeQuiz, onAbandonQuiz }) => {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [numQuestions, setNumQuestions] = useState(10);
    const [isTimedMode, setIsTimedMode] = useState(false);
    const [customTopics, setCustomTopics] = useState('');
    const [error, setError] = useState('');
    
    const isPaidUser = user.subscriptionTier === 'Professional' || user.subscriptionTier === 'Specialist';
    const [quizOptionsEnabled, setQuizOptionsEnabled] = useState(!isPaidUser);

    useEffect(() => {
        if (!isPaidUser) {
            setQuizOptionsEnabled(true);
        } else {
            const isUnlockedAndSelected = selectedExam ? user.unlockedExams.includes(selectedExam) : false;
            setQuizOptionsEnabled(isUnlockedAndSelected);
        }
    }, [selectedExam, user.unlockedExams, isPaidUser]);

    const handleExamClick = (exam: string) => {
        setError('');
        setSelectedExam(prevSelected => (prevSelected === exam ? null : exam));
    };

    const handleActionClick = () => {
        if (!selectedExam) {
            setError('Please select an exam to begin.');
            return;
        }
        setError('');
        onStartQuiz(selectedExam, numQuestions, isTimedMode, customTopics.trim());
    };
    
    const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : (user.subscriptionTier === 'Specialist' ? 2 : 0);
    const usedSlots = user.unlockedExams.length;
    
    const maxQuestions = user.subscriptionTier === 'Cadet' ? 10 : 120;

    const getButtonProps = () => {
        if (!selectedExam) {
            return { text: 'Select an Exam', disabled: true };
        }
        return { text: 'Start Quiz', disabled: false };
    };

    if (user.inProgressQuiz) {
        return (
            <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">You have a quiz in progress!</h2>
                <p className="text-gray-600 mb-6">
                    "{user.inProgressQuiz.quizSettings.examName}" - {user.inProgressQuiz.currentQuestionIndex} / {user.inProgressQuiz.questions.length} questions answered.
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={onResumeQuiz} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700">
                        Resume Session
                    </button>
                    <button onClick={onAbandonQuiz} className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-red-600">
                        Abandon & Start New
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {isPaidUser && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-md mb-6" role="alert">
                    <p className="font-bold">Subscription Status: {user.subscriptionTier}</p>
                    <p>You have unlocked {usedSlots} of {maxUnlocks} available exam slots.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    {Object.entries(allExams).map(([category, exams]) => (
                        <div key={category} className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">{category}</h2>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {exams.map(exam => {
                                    const isUnlocked = user.unlockedExams.includes(exam);
                                    return (
                                        <button 
                                            key={exam}
                                            onClick={() => handleExamClick(exam)}
                                            className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-2 ${selectedExam === exam ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700">{exam}</span>
                                                {isPaidUser && (
                                                    isUnlocked ? (
                                                        <span className="flex items-center text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                            Unlocked
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z" /></svg>
                                                            Locked
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-fit sticky top-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Quiz Configuration</h3>
                    
                    <fieldset disabled={!quizOptionsEnabled} className="space-y-6">
                        <div>
                            <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700">Number of Questions: <span className="font-bold">{numQuestions}</span></label>
                            <input
                                id="numQuestions"
                                type="range"
                                min="5"
                                max={maxQuestions}
                                step="5"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label htmlFor="customTopics" className="block text-sm font-medium text-gray-700 mb-1">Focus on Specific Topics <span className="text-xs text-gray-500">(Optional)</span></label>
                            <input
                                id="customTopics"
                                type="text"
                                placeholder="e.g., welding, NDE, corrosion"
                                value={customTopics}
                                onChange={(e) => setCustomTopics(e.target.value)}
                                disabled={user.subscriptionTier === 'Cadet'}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                            {user.subscriptionTier === 'Cadet' && <p className="text-xs text-gray-400 mt-1">Upgrade to Professional to enable this feature.</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Enable Timed Mode</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isTimedMode} onChange={(e) => setIsTimedMode(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </fieldset>
                    
                    {!quizOptionsEnabled && isPaidUser && selectedExam && (
                         <div className="mt-4 text-sm text-center text-blue-600 bg-blue-50 p-3 rounded-md">
                            Click "Start Quiz" to use a slot and unlock this exam. Once unlocked, these options will be enabled.
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                    
                    <div className="mt-8 space-y-4">
                         <button
                            onClick={handleActionClick}
                            disabled={getButtonProps().disabled}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {getButtonProps().text}
                        </button>
                        
                        {user.subscriptionTier !== 'Cadet' ? (
                            <button
                                onClick={onViewDashboard}
                                className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
                            >
                                View Performance Dashboard
                            </button>
                        ) : (
                            <button
                                onClick={onUpgrade}
                                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-yellow-600 transition-colors"
                            >
                                Upgrade for Full Access
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
