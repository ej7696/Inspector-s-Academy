import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAnswer(null);
  }, [question]);

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleNextClick = () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer);
      onNext();
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6" dangerouslySetInnerHTML={{ __html: question.question }} />
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors
              ${selectedAnswer === option
                ? 'bg-indigo-100 border-indigo-500'
                : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-8 text-right">
        <button
          onClick={handleNextClick}
          disabled={!selectedAnswer}
          className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
