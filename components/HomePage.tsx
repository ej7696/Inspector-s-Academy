import React, { useState, useMemo } from 'react';

interface HomePageProps {
  onStartQuiz: (topic: string, numQuestions: number) => void;
  loading: boolean;
  error: string | null;
}

// Restructure exams into categories
// Fix: Add a string index signature to allow iterating over keys with type safety.
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


const HomePage: React.FC<HomePageProps> = ({ onStartQuiz, loading, error }) => {
  const [selectedExam, setSelectedExam] = useState(categorizedExams["API Certifications"][2]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz(selectedExam, numQuestions);
  };

  const filteredExams = useMemo(() => {
    if (!searchTerm.trim()) {
      return categorizedExams;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const result: { [key: string]: string[] } = {};

    for (const category in categorizedExams) {
      // Fix: Remove `as any` type assertion to maintain type safety.
      const examsInCategory = categorizedExams[category];
      const filtered = examsInCategory.filter((exam: string) =>
        exam.toLowerCase().includes(lowercasedFilter)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }
    return result;
  }, [searchTerm]);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Creating Your Interactive Mock Exam</h1>
      <p className="text-lg text-gray-600 mb-8">
        Before I generate the exam, please confirm a few setup details. Select an exam and the number of questions to generate your personalized mock test.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="exam-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search for an Exam
          </label>
          <input
            id="exam-search"
            type="text"
            placeholder="e.g., API 653, Piping, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-2">
            Select Exam
          </label>
          <select
            id="exam"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            required
          >
            {Object.keys(filteredExams).length > 0 ? (
                Object.entries(filteredExams).map(([category, exams]) => (
                    <optgroup key={category} label={category}>
                        {exams.map((exam) => (
                        <option key={exam} value={exam}>
                            {exam}
                        </option>
                        ))}
                    </optgroup>
                ))
            ) : (
                <option disabled>No exams found</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            min="1"
            max="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
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