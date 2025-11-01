import React, { useState, useMemo } from 'react';

interface Props {
  onStartQuiz: (topic: string, numQuestions: number) => void;
  onViewDashboard: () => void;
  isPro: boolean;
  onUpgrade: () => void;
  isGenerating: boolean;
  isTimedMode: boolean;
  setIsTimedMode: (isTimed: boolean) => void;
}

const examCategories = {
    "API Certifications": [
      "API 510 - Pressure Vessel Inspector",
      "API 570 - Piping Inspector",
      "API 653 - Aboveground Storage Tank Inspector",
      "API 571 - Corrosion and Materials",
      "API 577 - Welding Inspection and Metallurgy",
      "API 580 - Risk Based Inspection",
      "API 936 - Refractory Inspector",
      "API 1169 - Pipeline Construction Inspector",
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

const HomePage: React.FC<Props> = ({
  onStartQuiz,
  onViewDashboard,
  isPro,
  onUpgrade,
  isGenerating,
  isTimedMode,
  setIsTimedMode,
}) => {
  const [selectedExam, setSelectedExam] = useState(examCategories["API Certifications"][2]); // Default to API 653
  const [numQuestions, setNumQuestions] = useState(10);
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!selectedExam) {
      setError('Please select an exam.');
      return;
    }
    if (numQuestions < 5 || numQuestions > 20) {
      setError('Number of questions must be between 5 and 20.');
      return;
    }
    if (!isPro && numQuestions > 10) {
        setError('Free users can generate up to 10 questions. Please upgrade for more.');
        setTimeout(() => onUpgrade(), 1500);
        return;
    }
    setError('');
    onStartQuiz(selectedExam, numQuestions);
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Interactive Mock Exam Generator</h1>
        <p className="text-lg text-gray-600">
          Select your exam, set the number of questions, and start your AI-powered practice session.
        </p>
      </header>
      
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md mb-6">
        <div className="mb-6">
            <div className="space-y-4">
                {Object.entries(examCategories).map(([category, exams]) => (
                    <div key={category}>
                        <h3 className="text-lg font-semibold text-gray-700 text-left mb-2">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {exams.map((exam) => (
                                <button
                                key={exam}
                                onClick={() => setSelectedExam(exam)}
                                className={`p-3 w-full text-left rounded-lg border-2 transition-all duration-200 ${
                                    selectedExam === exam
                                    ? 'bg-blue-500 border-blue-500 text-white font-semibold shadow-md'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                                }`}
                                >
                                {exam}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="numQuestions" className="block text-left font-semibold mb-2 text-gray-700">
                        Number of Questions ({isPro ? '5-20' : '5-10 for free users'})
                    </label>
                    <input
                        id="numQuestions"
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        min="5"
                        max={isPro ? "20" : "10"}
                        className="w-full p-3 border border-gray-300 rounded-lg text-center font-semibold text-lg"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-left font-semibold mb-2 text-gray-700">
                        Exam Mode
                    </label>
                    <button 
                        onClick={() => setIsTimedMode(!isTimedMode)}
                        className={`w-full p-3 border-2 rounded-lg font-semibold transition-colors ${
                            isTimedMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'
                        }`}>
                        {isTimedMode ? 'Timed Mode Enabled' : 'Enable Timed Mode'}
                    </button>
                </div>
            </div>
        </div>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleStart}
          disabled={isGenerating || !selectedExam}
          className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg"
        >
          {isGenerating ? 'Generating Exam...' : 'Start Exam'}
        </button>
      </div>

      {isPro ? (
         <button
            onClick={onViewDashboard}
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
            View Performance Dashboard
        </button>
      ) : (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Unlock Your Full Potential!</h3>
            <p className="text-gray-600 mb-4">
                Upgrade to Pro to access performance tracking, AI weakness analysis, and unlimited quizzes.
            </p>
            <button
                onClick={onUpgrade}
                className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg"
            >
                Upgrade to Pro Now
            </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;