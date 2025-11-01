import React from 'react';

interface Props {
  examName: string;
  effectivityInfo: string;
  onSelectMode: (mode: 'Open Book' | 'Closed Book') => void;
  onBack: () => void;
}

const ExamModeSelector: React.FC<Props> = ({ examName, effectivityInfo, onSelectMode, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Select Your Exam Session</h1>
      <p className="text-gray-600 mb-6">You are about to start an exam for: <span className="font-semibold">{examName}</span></p>

      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Based on Official API Publications:</h3>
          <div className="text-sm text-gray-600 whitespace-pre-line">{effectivityInfo}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open Book Card */}
        <div 
          onClick={() => onSelectMode('Open Book')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <h2 className="text-2xl font-bold text-blue-600 mb-3">Open Book</h2>
          <p className="text-gray-600">
            This session tests your ability to navigate the code book efficiently. Questions will require you to find specific answers, interpret clauses, and perform calculations based on provided references.
          </p>
        </div>

        {/* Closed Book Card */}
        <div 
          onClick={() => onSelectMode('Closed Book')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <h2 className="text-2xl font-bold text-green-600 mb-3">Closed Book</h2>
          <p className="text-gray-600">
            This session tests your foundational knowledge. Questions will focus on definitions, safety principles, and general procedures that you should know from memory without any reference materials.
          </p>
        </div>
      </div>
      
      <div className="mt-10">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:underline"
        >
          &larr; Go back and change exam
        </button>
      </div>
    </div>
  );
};

export default ExamModeSelector;
