import React, { useState } from 'react';

interface HomePageProps {
  onStartQuiz: (topic: string, numQuestions: number, isTimed: boolean) => void;
  loading: boolean;
  error: string | null;
  isPro: boolean;
  onNavigateToDashboard: () => void;
}

const categorizedExams: { [key: string]: string[] } = {
  "API Certifications": [
    "API 510 – Pressure Vessels 🔧",
    "API 570 – Piping Systems 🔩",
    "API 653 – Tanks 🛢",
    "API 580 – RBI 📊",
    "API 571 – Damage Mechanisms 🧪",
    "API 1169 – Pipelines 🛠",
  ],
  "SIFE/SIRE/SIEE Certifications": [
    "SIFE – Fixed Equipment ⚙️",
    "SIRE – Rotating Equipment 🔄",
    "SIEE – Electrical Equipment ⚡"
  ]
};

const HomePage: React.FC<HomePageProps> = ({ onStartQuiz, loading, error, isPro, onNavigateToDashboard }) => {
  const [selectedExam, setSelectedExam] = useState(categorizedExams["API Certifications"][2]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isTimed, setIsTimed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz(selectedExam, numQuestions, isTimed);
  };

  return (
    <div className="text-center">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-4xl font-bold text-gray-800 text-left">Create Your Mock Exam</h1>
        {isPro && (
          <button 
            onClick={onNavigateToDashboard}
            className="py-2 px-4 bg-white border border-indigo-600 text-indigo-600 font-semibold rounded-md shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            View Dashboard
          </button>
        )}
      </div>
      <p className="text-lg text-gray-600 mb-8 text-left">
        Select an exam and the number of questions to generate your personalized mock test.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Exam
          </label>
          <div className="space-y-5">
            {Object.keys(categorizedExams).map((category) => (
              <div key={category}>
                <h3 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categorizedExams[category].map((exam) => {
                    const isSelected = selectedExam === exam;
                    return (
                      <button
                        type="button"
                        key={exam}
                        onClick={() => setSelectedExam(exam)}
                        className={`w-full text-left p-3 rounded-md transition-all duration-200 border text-sm ${
                          isSelected
                            ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-200 font-semibold text-indigo-800'
                            : 'bg-white hover:bg-indigo-50 hover:border-indigo-400 border-gray-300'
                        }`}
                      >
                        {exam}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
            <div className="text-left">
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                id="numQuestions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                min="1"
                max={isPro ? "20" : "10"}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="text-left">
                <label htmlFor="timed-mode" className="block text-sm font-medium text-gray-700 mb-2">Exam Mode</label>
                <button
                    type="button"
                    onClick={() => setIsTimed(!isTimed)}
                    className={`w-full px-4 py-2 border rounded-md shadow-sm flex items-center justify-center font-medium ${isTimed ? 'bg-indigo-100 border-indigo-500 text-indigo-800' : 'bg-white border-gray-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isTimed ? 'Timed Mode Active' : 'Enable Timed Mode'}
                </button>
            </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Exam'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default HomePage;
