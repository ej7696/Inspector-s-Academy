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

    const handleActionClick = () => {
        if (!selectedExam) {
            setError('Please select an exam to begin.');
            return;
        }
        setError('');
        onStartQuiz(selectedExam, numQuestions, isTimedMode, customTopics.trim());
    };

    const handleExamClick = (exam: string) => {
        const isCurrentlySelected = selectedExam === exam;
        const isUnlocked = user.unlockedExams.includes(exam);
        const isPaid = user.subscriptionTier !== 'Cadet';

        if (isPaid && !isUnlocked) {
            // If a paid user clicks a locked exam, always trigger the unlock/start flow.
             onStartQuiz(exam, numQuestions, isTimedMode, customTopics.trim());
        } else {
             // If free user, or exam is already unlocked, just select it.
            setSelectedExam(isCurrentlySelected ? null : exam);
        }
    };
    
    const maxUnlocks = user.subscriptionTier === 'Professional' ? 1 : (user.subscriptionTier === 'Specialist' ? 2 : 0);
    const usedSlots = user.unlockedExams.length;
    const slotsAvailable = usedSlots < maxUnlocks;
    const maxQuestions = user.subscriptionTier === 'Cadet' ? 10 : 120;

    const getButtonProps = () => {
        if (!selectedExam) {
            return { text: 'Select an Exam', disabled: true };
        }
        if (user.subscriptionTier === 'Cadet') {
            return { text: 'Start Free Preview', disabled: false };
        }
    
        const isUnlocked = user.unlockedExams.includes(selectedExam);
    
        if (isUnlocked) {
            return { text: 'Start Quiz', disabled: false };
        }
        
        // For locked exams, the primary action is clicking the list item.
        // The main button remains disabled.
        return { text: 'Select an Exam to Unlock', disabled: true };
    };
    
    const buttonProps = getButtonProps();
    const areAdvancedOptionsDisabled = user.subscriptionTier === 'Cadet' || (isPaidUser && !quizOptionsEnabled);

    if (user.inProgressQuiz) {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 text-center">
                <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Resume Your Session</h2>
                    <p className="text-gray-600 mb-6">
                        You have an in-progress exam for: <br />
                        <strong className="text-xl text-gray-800 mt-1 block">{user.inProgressQuiz.quizSettings.examName}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        {user.inProgressQuiz.currentQuestionIndex + 1} / {user.inProgressQuiz.questions.length} questions answered.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onResumeQuiz}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                        >
                            Resume Exam
                        </button>
                        <button
                            onClick={onAbandonQuiz}
                            className="bg-red-100 text-red-700 px-6 py-3 rounded-lg font-semibold text-lg hover:bg-red-200 transition-colors"
                        >
                            Abandon & Start New
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {user.subscriptionTier === 'Cadet' && (
                 <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-sm mb-6" role="alert">
                    <div className="flex">
                        <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
                        <div>
                            <p className="font-bold">You are on the Free Cadet Plan</p>
                            <p className="text-sm">Upgrade to unlock full-length exams, performance tracking, and AI-powered study tools.</p>
                            <button onClick={onUpgrade} className="mt-2 bg-yellow-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-yellow-600">View Plans</button>
                        </div>
                    </div>
                </div>
            )}

            {isPaidUser && (
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md shadow-sm mb-6">
                    <p className="font-bold">Subscription Status: {user.subscriptionTier}</p>
                    <p className="text-sm">You have unlocked <span className="font-bold">{usedSlots}</span> of <span className="font-bold">{maxUnlocks}</span> available exam slots.</p>
                </div>
            )}
           
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Exam Selection */}
                    <div>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             {Object.entries(allExams).map(([category, exams]) => (
                                <div key={category}>
                                    <h3 className="font-semibold text-gray-600 mt-3 mb-2">{category}</h3>
                                    <div className="space-y-2">
                                        {exams.map(exam => {
                                            const isUnlocked = user.unlockedExams.includes(exam);
                                            const isLockedNoSlots = isPaidUser && !isUnlocked && !slotsAvailable;
                                            
                                            return (
                                                <button 
                                                    key={exam}
                                                    onClick={() => handleExamClick(exam)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ${
                                                        selectedExam === exam ? 'bg-blue-100 border-blue-500 font-semibold' : 'bg-gray-50 border-gray-200'
                                                    } ${
                                                        isLockedNoSlots ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-100'
                                                    }`}
                                                    aria-pressed={selectedExam === exam}
                                                    disabled={isLockedNoSlots}
                                                >
                                                    <span>{exam}</span>
                                                    {isPaidUser && (
                                                        isUnlocked ? (
                                                            <span className="flex items-center text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                Unlocked
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm5-3a3 3 0 00-3 3v2h6V7a3 3 0 00-3-3z" clipRule="evenodd" /></svg>
                                                                Click to Unlock
                                                            </span>
                                                        )
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Options & Actions */}
                    <div className="space-y-6">
                         <div>
                             <div>
                                <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Questions: <span className="font-bold">{numQuestions}</span>
                                </label>
                                <input
                                    type="range"
                                    id="numQuestions"
                                    min="5"
                                    max={maxQuestions}
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isPaidUser && !quizOptionsEnabled}
                                />
                                {user.subscriptionTier === 'Cadet' && <p className="text-xs text-gray-500 mt-1">Upgrade for up to 120 questions.</p>}
                            </div>
                            <div className="mt-4">
                                <label htmlFor="customTopics" className="block text-sm font-medium text-gray-700 mb-1">
                                    Focus on Specific Topics (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="customTopics"
                                    value={customTopics}
                                    onChange={(e) => setCustomTopics(e.target.value)}
                                    placeholder="e.g., welding, NDE, corrosion"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={areAdvancedOptionsDisabled}
                                />
                                {user.subscriptionTier === 'Cadet' && <p className="text-xs text-gray-500 mt-1">Upgrade to use targeted topic generation.</p>}
                            </div>
                            <div className="mt-4">
                               <label className={`flex items-center ${areAdvancedOptionsDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isTimedMode} onChange={() => !areAdvancedOptionsDisabled && setIsTimedMode(!isTimedMode)} disabled={areAdvancedOptionsDisabled} />
                                        <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isTimedMode ? 'transform translate-x-full bg-blue-500' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-gray-700 font-medium">
                                        Enable Timed Mode
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t">
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button
                                onClick={handleActionClick}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={buttonProps.disabled}
                            >
                                {buttonProps.text}
                            </button>
                             {user.subscriptionTier !== 'Cadet' && (
                                <button
                                    onClick={onViewDashboard}
                                    className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors"
                                >
                                    View Performance Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;