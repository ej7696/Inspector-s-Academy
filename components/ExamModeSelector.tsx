import React from 'react';

interface Props {
    examName: string;
    onSelectMode: (mode: 'open' | 'closed' | 'simulation') => void;
    onGoHome: () => void;
}

const ExamModeSelector: React.FC<Props> = ({ examName, onSelectMode, onGoHome }) => {
    return (
        <div className="max-w-4xl mx-auto my-10 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Your Exam Session</h1>
            <p className="text-lg text-gray-600 mb-8">You are about to start a quiz for the <span className="font-semibold text-blue-600">{examName}</span> certification.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Open Book Card */}
                <div 
                    onClick={() => onSelectMode('open')}
                    className="bg-white p-6 rounded-lg shadow-lg border-2 border-transparent hover:border-blue-500 hover:shadow-xl cursor-pointer transition-all"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Open Book Session</h2>
                    <p className="text-gray-600">
                        This session tests your ability to efficiently find and apply information from the official code documents under time pressure.
                    </p>
                </div>

                {/* Closed Book Card */}
                <div 
                    onClick={() => onSelectMode('closed')}
                    className="bg-white p-6 rounded-lg shadow-lg border-2 border-transparent hover:border-blue-500 hover:shadow-xl cursor-pointer transition-all"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Closed Book Session</h2>
                    <p className="text-gray-600">
                        This session tests your foundational knowledge of concepts, definitions, and procedures that you must know from memory.
                    </p>
                </div>
            </div>

            {/* Full Simulation Card */}
            <div 
                onClick={() => onSelectMode('simulation')}
                className="mt-6 bg-indigo-50 p-6 rounded-lg shadow-lg border-2 border-transparent hover:border-indigo-500 hover:shadow-xl cursor-pointer transition-all"
            >
                <h2 className="text-2xl font-bold text-indigo-800 mb-3">Full Exam Simulation</h2>
                <p className="text-indigo-700">
                    Replicates the complete exam experience, starting with a timed closed-book session, followed by a timed open-book session.
                </p>
            </div>

            <button
                onClick={onGoHome}
                className="mt-10 text-gray-600 hover:text-blue-600 font-semibold"
            >
                &larr; Or go back to exam selection
            </button>
        </div>
    );
};

export default ExamModeSelector;