
import React from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  onSelectAnswer: (answer: string) => void;
  selectedAnswer: string | null;
}

const QuestionCard: React.FC<Props> = ({ question, onSelectAnswer, selectedAnswer }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">{question.question}</h2>
      <div className="space-y-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          
          let buttonClass = 'bg-white border-gray-300 hover:bg-gray-100'; // Default
          if (isSelected) {
            buttonClass = 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'; // Selected
          }
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-gray-700 font-medium text-lg ${buttonClass}`}
            >
              <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
