import React, { useState } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onNext: () => void;
  isLastQuestion: boolean;
  isPro: boolean;
  onFollowUp: (followUpQuestion: string, context: Question) => Promise<string>;
}

const QuestionCard: React.FC<Props> = ({ question, onAnswer, onNext, isLastQuestion, isPro, onFollowUp }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer) {
      const correct = selectedAnswer === question.answer;
      setIsCorrect(correct);
      onAnswer(selectedAnswer, correct);
      setIsSubmitted(true);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!followUpQuestion.trim()) return;
      setIsFollowingUp(true);
      setFollowUpAnswer('');
      const response = await onFollowUp(followUpQuestion, question);
      setFollowUpAnswer(response);
      setIsFollowingUp(false);
  }

  const getOptionClass = (option: string) => {
    if (!isSubmitted) {
      return selectedAnswer === option ? 'bg-blue-200 border-blue-500 ring-2 ring-blue-400' : 'bg-white hover:bg-gray-100';
    }
    // After submission
    if (option === question.answer) {
      return 'bg-green-100 border-green-500'; // Correct answer
    }
    if (option === selectedAnswer && option !== question.answer) {
      return 'bg-red-100 border-red-500'; // Incorrectly selected answer
    }
    return 'bg-gray-100 text-gray-500 border-gray-200'; // Not selected, not correct
  };
  
  const getIcon = (option: string) => {
      if (!isSubmitted) return null;
      if (option === question.answer) {
        return <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
      }
      if (option === selectedAnswer && option !== question.answer) {
        return <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
      }
      return <div className="w-6 h-6"></div>; // Placeholder for alignment
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
      <p className="text-lg font-semibold text-gray-800 mb-1">Question</p>
      <p className="text-xl font-normal text-gray-700 mb-6" dangerouslySetInnerHTML={{ __html: question.question }} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isSubmitted && setSelectedAnswer(option)}
            disabled={isSubmitted}
            className={`flex items-center justify-between w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${getOptionClass(option)}`}
          >
            <span className="flex-grow" dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65 + index)}. ${option}` }} />
            {getIcon(option)}
          </button>
        ))}
      </div>
      
      {!isSubmitted ? (
        <div className="mt-6 text-center">
            <button 
                onClick={handleSubmit} 
                disabled={!selectedAnswer}
                className="bg-blue-600 text-white px-10 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
                Submit Answer
            </button>
        </div>
      ) : (
         <div className="mt-6">
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct!' : `Not quite - the correct answer is ${question.answer.split('.')[0]}`}
                </h3>
                 <p className="font-semibold mt-4 text-gray-700">Reference:</p>
                 <p className="text-gray-600 italic">{question.reference}</p>

                 <p className="font-semibold mt-3 text-gray-700">Code Quote:</p>
                 <p className="text-gray-600 italic bg-gray-100 p-2 rounded">"{question.quote}"</p>

                <div className="mt-3">
                    <button onClick={() => setShowExplanation(!showExplanation)} className="font-semibold text-blue-600 hover:underline">
                       {showExplanation ? 'Hide' : 'Show'} Quick Explanation
                    </button>
                    {showExplanation && <p className="mt-2 text-gray-700">{question.explanation}</p>}
                </div>
            </div>
            
            {isPro && (
                 <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <form onSubmit={handleFollowUpSubmit}>
                        <label htmlFor="followUp" className="font-semibold text-gray-700">Ask a follow-up question:</label>
                        <textarea
                            id="followUp"
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            className="w-full mt-2 p-2 border rounded-md"
                            rows={2}
                            placeholder="e.g., Can you explain that in simpler terms?"
                        />
                        <button type="submit" disabled={isFollowingUp} className="mt-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400">
                           {isFollowingUp ? 'Thinking...' : 'Ask AI'}
                        </button>
                    </form>
                    {followUpAnswer && (
                        <div className="mt-3 p-3 bg-white rounded-md border">
                             <p className="text-gray-800">{followUpAnswer}</p>
                        </div>
                    )}
                 </div>
            )}

            <div className="mt-6 text-center">
                <button 
                    onClick={onNext} 
                    className="bg-green-600 text-white px-10 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
                >
                    {isLastQuestion ? 'Finish Exam' : 'Next Question'}
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default QuestionCard;
