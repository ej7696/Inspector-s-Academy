import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface Props {
  questionNum: number;
  totalQuestions: number;
  question: Question;
  onSelectAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  onNext: () => void;
  isLastQuestion: boolean;
  isSimulationClosedBook: boolean;
}

const QuestionCard: React.FC<Props> = ({ questionNum, totalQuestions, question, onSelectAnswer, selectedAnswer, onNext, isLastQuestion, isSimulationClosedBook }) => {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, [question]);

  const handleSubmit = () => {
    if (selectedAnswer) {
      setSubmitted(true);
    }
  };

  const isCorrect = question.answer === selectedAnswer;
  const finishButtonText = isLastQuestion 
    ? (isSimulationClosedBook ? 'Proceed to Open Book Session' : 'Finish Exam') 
    : 'Next Question';

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-500 mb-2">Question {questionNum} of {totalQuestions}</p>
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">{question.question}</h2>
      
      <div className="space-y-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = question.answer === option;

          let buttonClass = 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700';
          
          if (submitted) {
            if (isCorrectAnswer) {
              buttonClass = 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500';
            } else if (isSelected && !isCorrectAnswer) {
              buttonClass = 'bg-red-100 border-red-500 text-red-800';
            } else {
              buttonClass = 'bg-gray-100 border-gray-200 text-gray-500 cursor-default';
            }
          } else if (isSelected) {
            buttonClass = 'bg-blue-100 border-blue-500 ring-2 ring-blue-500';
          }
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(option)}
              disabled={submitted}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 font-medium text-lg flex justify-between items-center ${buttonClass}`}
            >
              <div>
                <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                {option}
              </div>
              {submitted && isCorrectAnswer && (
                <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              )}
              {submitted && isSelected && !isCorrectAnswer && (
                <svg className="w-6 h-6 text-red-700" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t min-h-[52px]">
        {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="w-full md:w-auto float-right bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
        ) : (
          <div className="flex flex-col">
            <div className="space-y-4 mb-6">
              <p className="text-gray-700 text-lg"><span className="font-semibold">You said:</span> {selectedAnswer}</p>
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="font-semibold text-gray-800">Inspector's Academy said:</p>
                <p className={`font-bold text-lg mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite...'}
                </p>
                {!isCorrect && <p className="mt-2 text-gray-800"><span className="font-semibold">Answer:</span> {question.answer}</p>}
              </div>
              {(!isSimulationClosedBook && question.reference) && (
                <p className="text-gray-600 mt-4">
                    <span className="font-semibold block text-gray-800">Reference:</span> {question.reference}
                </p>
              )}
              {(!isSimulationClosedBook && question.explanation) && (
                <div className="mt-4">
                    <h3 className="font-semibold text-gray-800">Quick Rationale:</h3>
                    <blockquote className="border-l-4 pl-4 text-gray-700 mt-1">
                        <p>{question.explanation}</p>
                    </blockquote>
                </div>
              )}
            </div>

            <button
                onClick={onNext}
                className="w-full md:w-auto self-end bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
            >
                {finishButtonText}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default QuestionCard;