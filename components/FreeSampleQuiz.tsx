

import React, { useState } from 'react';
import { Question } from '../types';
import api from '../services/apiService';

interface Props {
  onSignup: () => void;
}

const sampleQuestions: Question[] = [
    {
        question: "According to API 510, what is the maximum inspection interval for an internal or on-stream inspection of a pressure vessel with a remaining life of 12 years?",
        type: "multiple-choice",
        options: ["5 years", "6 years", "10 years", "12 years"],
        answer: "6 years",
        explanation: "The interval is the lesser of 1/2 the remaining life (12/2 = 6 years) or 10 years. Therefore, the maximum interval is 6 years.",
        category: "Inspection Intervals"
    },
    {
        question: "In welding, a WPS stands for:",
        type: "multiple-choice",
        options: ["Welding Performance Specification", "Welder Procedure Specification", "Welding Procedure Specification", "Weld Performance Standard"],
        answer: "Welding Procedure Specification",
        explanation: "WPS stands for Welding Procedure Specification, which is a formal written document describing welding procedures.",
        category: "Welding"
    },
    {
        question: "True or False: A hydrostatic test is typically conducted at a pressure lower than the vessel's MAWP.",
        type: "true-false",
        answer: "False",
        explanation: "A hydrostatic test is conducted at a pressure *higher* than the MAWP, typically 1.3 to 1.5 times the MAWP, to ensure the vessel's integrity.",
        category: "Pressure Testing"
    }
];

const FreeSampleQuiz: React.FC<Props> = ({ onSignup }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (sampleQuestions[currentQuestionIndex].answer === answer) {
        setCorrectAnswers(prev => prev + 1);
    }

    setTimeout(() => {
        if (currentQuestionIndex < sampleQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            api.logActivity('sample_quiz_completed', 'completed the free sample quiz.', 'anonymous', 'anonymous');
            setIsFinished(true);
        }
    }, 1000); // Wait 1 second before moving to next
  };
  
  if (isFinished) {
    return (
        <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">Quiz Complete!</h3>
            <p className="text-lg text-gray-600 mt-2">You got {correctAnswers} out of {sampleQuestions.length} correct.</p>
            <p className="mt-4 text-xl text-gray-700">Like these questions? Get 15 more every month for free.</p>
            <button type="button" onClick={onSignup} className="mt-6 bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-700 transition-transform hover:scale-105">
                Create Your Free Starter Account
            </button>
        </div>
    );
  }

  const question = sampleQuestions[currentQuestionIndex];
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-sm font-semibold text-gray-500 text-center mb-2">Question {currentQuestionIndex + 1} of {sampleQuestions.length}</p>
      <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">{question.question}</h3>
      <div className="space-y-3">
        {question.options ? question.options.map(option => (
          <button 
            key={option} 
            onClick={() => handleAnswer(option)}
            disabled={!!selectedAnswer}
            className={`w-full p-4 rounded-lg border-2 text-left font-semibold
                ${selectedAnswer 
                    ? (option === question.answer ? 'bg-green-100 border-green-500' : (option === selectedAnswer ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-300'))
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
          >
            {option}
          </button>
        )) : ['True', 'False'].map(option => (
             <button 
                key={option} 
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`w-full p-4 rounded-lg border-2 text-center font-semibold
                    ${selectedAnswer 
                        ? (option === question.answer ? 'bg-green-100 border-green-500' : (option === selectedAnswer ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-300'))
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
            >
                {option}
            </button>
        ))}
      </div>
    </div>
  );
};

export default FreeSampleQuiz;