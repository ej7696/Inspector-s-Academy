import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  isPro: boolean;
  onAskFollowUp: (context: { question: string, explanation: string }, followUpQuestion: string) => Promise<string>;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FollowUpSection: React.FC<{
    question: Question;
    onAskFollowUp: (context: { question: string, explanation: string }, followUpQuestion: string) => Promise<string>;
}> = ({ question, onAskFollowUp }) => {
    const [followUpQuery, setFollowUpQuery] = useState('');
    const [followUpAnswer, setFollowUpAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFollowUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!followUpQuery) return;
        setIsLoading(true);
        setFollowUpAnswer('');
        const answer = await onAskFollowUp({ question: question.question, explanation: question.explanation }, followUpQuery);
        setFollowUpAnswer(answer);
        setIsLoading(false);
    };

    return (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-indigo-800 mb-2">Ask a follow-up question:</p>
            <form onSubmit={handleFollowUpSubmit}>
                <textarea
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    placeholder="e.g., What does 'brittle fracture' mean?"
                    className="w-full p-2 border border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                />
                <button
                    type="submit"
                    disabled={isLoading || !followUpQuery}
                    className="mt-2 py-1 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Thinking...' : 'Ask'}
                </button>
            </form>
            {followUpAnswer && (
                <div className="mt-4 p-3 bg-white rounded-md border border-indigo-200">
                    <p className="text-gray-700">{followUpAnswer}</p>
                </div>
            )}
        </div>
    );
};


const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  isPro,
  onAskFollowUp
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsExplanationExpanded(false);
  }, [question]);

  const handleSelectAnswer = (option: string) => {
    if (!isSubmitted) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer) {
      setIsSubmitted(true);
      onAnswer(selectedAnswer);
    }
  };
  
  const handleNext = () => {
    onNext();
  }

  const isCorrect = selectedAnswer === question.answer;

  const getOptionClass = (option: string) => {
    if (!isSubmitted) {
      if (selectedAnswer === option) return 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-200';
      return 'bg-white hover:bg-indigo-50 border-gray-300';
    }
    if (option === question.answer) return 'bg-green-100 text-green-800 font-semibold border-green-500';
    if (option === selectedAnswer && option !== question.answer) return 'bg-red-100 text-red-800 border-red-500';
    return 'bg-gray-50 text-gray-500 border-gray-300';
  };

  return (
    <div>
      <p className="text-lg font-semibold text-gray-700 mb-4">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="text-2xl font-bold text-gray-800 mb-6" dangerouslySetInnerHTML={{ __html: question.question }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            disabled={isSubmitted}
            className={`w-full text-left p-3 rounded-md transition-colors disabled:cursor-not-allowed border flex justify-between items-center ${getOptionClass(option)}`}
          >
            <span>{option}</span>
            {isSubmitted && option === question.answer && <CheckIcon />}
            {isSubmitted && selectedAnswer === option && !isCorrect && <CrossIcon />}
          </button>
        ))}
      </div>
      <div className="mt-8 text-right">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {questionNumber === totalQuestions ? 'Finish Exam' : 'Next Question'}
          </button>
        )}
      </div>

      {isSubmitted && selectedAnswer && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-5 text-left text-gray-800">
            <div>
              <p className="text-md"><span className="font-semibold text-gray-600">You said:</span> {selectedAnswer}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600 mb-2">Inspector's Academy said:</p>
              <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : `Not quite — the correct answer is ${question.answer}`}
                </p>
              </div>
            </div>

            <p className="text-md"><span className="font-semibold text-gray-600">Reference:</span> {question.reference}</p>
            
            <div className="p-4 bg-gray-50 border-l-4 border-gray-300 italic">
              "{question.quote}"
            </div>

            <div>
              <button
                onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                className="w-full flex justify-between items-center text-left py-2 px-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                aria-expanded={isExplanationExpanded}
                aria-controls="explanation-content"
              >
                <span className="font-semibold text-gray-600">Quick Explanation:</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    isExplanationExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExplanationExpanded && (
                <div id="explanation-content" className="mt-2 pl-3 text-gray-700">
                  <p>{question.explanation}</p>
                  {isPro && <FollowUpSection question={question} onAskFollowUp={onAskFollowUp} />}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default QuestionCard;
