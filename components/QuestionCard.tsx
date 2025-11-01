import React, { useState } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  userAnswer: string | null;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  isPro: boolean;
  onAskFollowUp: (followUpQuestion: string, originalQuestion: Question) => void;
  followUpResponse: string | null;
  isGettingFollowUp: boolean;
}

const CheckIcon = () => (
    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);
const CrossIcon = () => (
    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);
const ChevronUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
);


const QuestionCard: React.FC<Props> = ({
  question,
  userAnswer,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  isPro,
  onAskFollowUp,
  followUpResponse,
  isGettingFollowUp,
}) => {
  const isAnswered = userAnswer !== null;
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");

  const handleFollowUpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(followUpQuestion.trim()) {
          onAskFollowUp(followUpQuestion, question);
      }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-semibold text-gray-500 mb-2">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="text-xl font-bold text-gray-800 mb-6">{question.question}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isSelected = userAnswer === option;
          const isCorrect = question.answer === option;
          let buttonClass = 'w-full text-left p-3 rounded-lg border-2 flex items-center justify-between transition-all duration-200 ';

          if (isAnswered) {
            if (isCorrect) {
              buttonClass += 'bg-green-100 border-green-500 text-green-800 font-semibold';
            } else if (isSelected) {
              buttonClass += 'bg-red-100 border-red-500 text-red-800 font-semibold';
            } else {
              buttonClass += 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed';
            }
          } else {
            buttonClass += 'bg-white hover:bg-blue-50 border-gray-300 text-gray-700 hover:border-blue-400';
          }

          return (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <span>{option}</span>
              {isAnswered && isCorrect && <CheckIcon />}
              {isAnswered && isSelected && !isCorrect && <CrossIcon />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700">You said: <span className="font-semibold">{userAnswer}</span></p>
                <div className={`mt-2 flex items-center ${userAnswer === question.answer ? 'text-green-700' : 'text-red-700'}`}>
                    <div className="font-bold">{userAnswer === question.answer ? "Correct!" : `Not quite — the correct answer is A. ${question.answer}.`}</div>
                </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                 {question.reference && (
                    <p className="mb-2 text-sm text-gray-600">
                    <span className="font-bold">Reference:</span> {question.reference}
                </p>
                )}
                {question.quote && (
                    <p className="mb-4 text-sm text-gray-700 italic border-l-4 border-gray-300 pl-3">
                    "{question.quote}"
                </p>
                )}
                
                <button 
                    onClick={() => setIsExplanationOpen(!isExplanationOpen)} 
                    className="w-full flex justify-between items-center text-left font-semibold text-gray-700"
                >
                    Quick Explanation
                    {isExplanationOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isExplanationOpen && (
                    <p className="mt-2 text-gray-700">
                        {question.explanation}
                    </p>
                )}
            </div>
            
            {isPro && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="font-semibold text-gray-700">Ask a follow-up question</label>
                    <form onSubmit={handleFollowUpSubmit} className="mt-2 flex flex-col sm:flex-row gap-2">
                        <textarea
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg flex-grow resize-none"
                            placeholder="e.g., Explain this in simpler terms..."
                            rows={1}
                        />
                        <button type="submit" disabled={isGettingFollowUp} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400">
                            {isGettingFollowUp ? 'Thinking...' : 'Ask AI'}
                        </button>
                    </form>
                    {followUpResponse && (
                         <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
                            <p className="text-gray-800">{followUpResponse}</p>
                         </div>
                    )}
                </div>
            )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isAnswered}
        className="mt-6 w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-lg"
      >
        {isLastQuestion ? 'Finish Exam' : 'Next Question'}
      </button>
    </div>
  );
};

export default QuestionCard;
