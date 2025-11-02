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
  isPro: boolean;
  onAskFollowUp: (question: Question, query: string) => void;
  followUpAnswer: string;
  isFollowUpLoading: boolean;
}

const QuestionCard: React.FC<Props> = ({ 
    questionNum, 
    totalQuestions, 
    question, 
    onSelectAnswer, 
    selectedAnswer, 
    onNext, 
    isLastQuestion, 
    isSimulationClosedBook,
    isPro,
    onAskFollowUp,
    followUpAnswer,
    isFollowUpLoading 
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState('');

  useEffect(() => {
    setSubmitted(false);
    setShowExplanation(false);
    setFollowUpQuery('');
  }, [question]);

  const handleSubmit = () => {
    if (selectedAnswer) {
      setSubmitted(true);
    }
  };
  
  const handleAsk = () => {
    if (followUpQuery.trim()) {
        onAskFollowUp(question, followUpQuery);
    }
  };

  const getOptionClasses = (option: string) => {
    if (!submitted) {
      return selectedAnswer === option 
        ? 'bg-blue-100 border-blue-500' 
        : 'bg-gray-50 border-gray-300 hover:bg-gray-100';
    }
    // After submission
    const isCorrectAnswer = option === question.answer;
    const isSelectedAnswer = option === selectedAnswer;

    if (isCorrectAnswer) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    if (isSelectedAnswer && !isCorrectAnswer) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    return 'bg-gray-50 border-gray-300 text-gray-500';
  };

  const nextButtonText = () => {
      if (isLastQuestion) {
          if (isSimulationClosedBook) {
              return "Proceed to Open Book";
          }
          return "Finish Exam";
      }
      return "Next Question";
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Question {questionNum} of {totalQuestions}</h2>
      <p className="text-lg text-gray-700 mb-6">{question.question}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !submitted && onSelectAnswer(option)}
            disabled={submitted}
            className={`p-4 rounded-lg border-2 text-left transition-colors duration-200 ${getOptionClasses(option)}`}
          >
            <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
          </button>
        ))}
      </div>
      
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      ) : (
        <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="font-semibold">Your Answer: <span className="font-normal">{selectedAnswer}</span></p>
                <p className={`font-semibold ${selectedAnswer === question.answer ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAnswer === question.answer ? 'Correct!' : 'Not quite - correct answer is:'}
                </p>
                {selectedAnswer !== question.answer && <p className="font-semibold text-green-700">{question.answer}</p>}
            </div>

            {(!isSimulationClosedBook && (question.explanation || question.reference)) && (
                <div className="p-4 rounded-lg bg-gray-50 border space-y-4">
                    <button onClick={() => setShowExplanation(!showExplanation)} className="font-semibold text-blue-600 hover:underline flex items-center">
                        View Explanation & Reference
                        <svg className={`w-5 h-5 ml-1 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {showExplanation && (
                        <div className="space-y-4 pt-4 border-t">
                            {question.reference && <p><strong className="font-semibold text-gray-700">Reference:</strong> {question.reference}</p>}
                            {question.explanation && <p><strong className="font-semibold text-gray-700">Rationale:</strong> {question.explanation}</p>}

                            {isPro && (
                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-700 mb-2">Ask a follow-up question (AI Tutor)</h4>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={followUpQuery}
                                            onChange={(e) => setFollowUpQuery(e.target.value)}
                                            placeholder="e.g., Explain that in simpler terms"
                                            className="flex-grow p-2 border rounded-md"
                                        />
                                        <button onClick={handleAsk} disabled={isFollowUpLoading} className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:bg-gray-400">
                                            {isFollowUpLoading ? 'Asking...' : 'Ask'}
                                        </button>
                                    </div>
                                    {isFollowUpLoading && <p className="text-sm text-gray-500 mt-2">Getting an answer...</p>}
                                    {followUpAnswer && <div className="mt-4 p-3 bg-indigo-50 rounded-md text-gray-800">{followUpAnswer}</div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          
          <button
            onClick={onNext}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            {nextButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;