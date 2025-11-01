import React, { useState } from 'react';
import { User } from '../types';

interface Props {
    user: User;
    onStartQuiz: (examName: string, numQuestions: number, isTimed: boolean) => void;
    onViewDashboard: () => void;
    onUpgrade: () => void;
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

const HomePage: React.FC<Props> = ({ user, onStartQuiz, onViewDashboard, onUpgrade }) => {
    const [selectedExam, setSelectedExam] = useState<string | null>("API 653 - Aboveground Storage Tank Inspector");
    const [numQuestions, setNumQuestions] = useState(10);
    const [isTimedMode, setIsTimedMode] = useState(false);
    const [error, setError] = useState('');

    const handleStart = () => {
        if (!selectedExam) {
            setError('Please select an exam to begin.');
            return;
        }
        setError('');
        onStartQuiz(selectedExam, numQuestions, isTimedMode);
    };

    const isExamUnlocked = (examName: string) => {
        if(user.role === 'ADMIN') return true;
        if(user.subscriptionTier === 'Cadet') return false;
        return user.unlockedExams.includes(examName);
    }
    
    const maxQuestions = user.subscriptionTier === 'Cadet' ? 10 : 120;

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
           
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Exam Selection */}
                    <div>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             {Object.entries(allExams).map(([category, exams]) => (
                                <div key={category}>
                                    <h3 className="font-semibold text-gray-600 mt-3 mb-2">{category}</h3>
                                    <div className="space-y-2">
                                        {exams.map(exam => (
                                            <button 
                                                key={exam}
                                                onClick={() => setSelectedExam(exam)}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ${selectedExam === exam ? 'bg-blue-100 border-blue-500 font-semibold' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                                aria-pressed={selectedExam === exam}
                                            >
                                                <span>{exam}</span>
                                                {user.subscriptionTier !== 'Cadet' && (
                                                    isExamUnlocked(exam) ? 
                                                    <span className="text-xs text-green-600 font-bold">Unlocked</span> :
                                                    <span className="text-xs text-gray-500 font-bold">Locked</span>
                                                )}
                                            </button>
                                        ))}
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
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                {user.subscriptionTier === 'Cadet' && <p className="text-xs text-gray-500 mt-1">Upgrade for up to 120 questions.</p>}
                            </div>
                            <div className="mt-4">
                               <label className={`flex items-center ${user.subscriptionTier === 'Cadet' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isTimedMode} onChange={() => user.subscriptionTier !== 'Cadet' && setIsTimedMode(!isTimedMode)} disabled={user.subscriptionTier === 'Cadet'} />
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
                                onClick={handleStart}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                disabled={!selectedExam}
                            >
                                Generate & Start Quiz
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