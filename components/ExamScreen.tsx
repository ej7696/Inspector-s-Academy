import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizSettings, InProgressAnswer } from '../types';
import { FlagIcon, StrikethroughIcon, PreviousIcon, NextIcon, NavigatorIcon, ClockIcon, ExitIcon, CalculatorIcon } from './ExamIcons';
import Calculator from './Calculator';

interface Props {
  questions: Question[];
  quizSettings: QuizSettings;
  currentIndex: number;
  answers: InProgressAnswer[];
  onSelectAnswer: (answer: string) => void;
  onNavigate: (destination: 'next' | 'prev' | number) => void;
  onToggleFlag: () => void;
  onToggleStrikethrough: (option: string) => void;
  onSubmit: () => void;
  onSaveAndExit: (time: number) => void;
}

const ExamScreen: React.FC<Props> = ({
  questions, quizSettings, currentIndex, answers, onSelectAnswer, onNavigate, onToggleFlag, onToggleStrikethrough, onSubmit, onSaveAndExit
}) => {
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizSettings.numQuestions * 90); // 1.5 mins per question
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isAnswered = !!currentAnswer?.userAnswer;
  
  const thirtyMinAlert = useRef(false);
  const fiveMinAlert = useRef(false);

  useEffect(() => {
    setShowExplanation(false);
  }, [currentIndex]);
  
  useEffect(() => {
    if (!quizSettings.isTimed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Time's up! Your exam will now be submitted.");
          onSubmit();
          return 0;
        }

        // Timed alerts
        if (prev <= 30 * 60 && !thirtyMinAlert.current) {
            alert("You have 30 minutes remaining.");
            thirtyMinAlert.current = true;
        }
        if (prev <= 5 * 60 && !fiveMinAlert.current) {
            alert("You have 5 minutes remaining.");
            fiveMinAlert.current = true;
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizSettings.isTimed, onSubmit]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  
  const getQuestionStatusClass = (index: number) => {
    const answer = answers[index];
    
    if (answer?.userAnswer) {
      const question = questions[index];
      const isCorrect = question.answer === answer.userAnswer;
      if (isCorrect) {
        return 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200';
      } else {
        return 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200';
      }
    }
    
    if (answer?.flagged) {
      return 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200';
    }
    
    return 'bg-white border-gray-400 text-gray-800 hover:bg-gray-200';
  };
  
  const getOptionClasses = (option: string) => {
    if (!isAnswered) {
      return 'bg-gray-50 border-gray-300 hover:bg-gray-100';
    }
    
    const isCorrectAnswer = option === currentQuestion.answer;
    const isSelectedAnswer = option === currentAnswer.userAnswer;

    if (isCorrectAnswer) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    if (isSelectedAnswer && !isCorrectAnswer) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    return 'bg-gray-50 border-gray-300 text-gray-500';
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-3 bg-white shadow-md text-gray-800 z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsNavigatorVisible(!isNavigatorVisible)} className="p-2 rounded-md hover:bg-gray-200" title="Toggle Navigator">
            <NavigatorIcon />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-xs">{quizSettings.examName}</h1>
            <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {quizSettings.isTimed && (
            <div className={`flex items-center gap-2 font-mono text-base sm:text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-800'}`}>
              <ClockIcon />
              <span className="hidden sm:inline">{formatTime(timeLeft)}</span>
            </div>
          )}
          <button onClick={() => setIsCalculatorOpen(true)} className="p-2 rounded-md hover:bg-gray-200" title="Open Calculator">
             <CalculatorIcon className="w-5 h-5 text-gray-600"/>
          </button>
          <button onClick={() => onSaveAndExit(timeLeft)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 p-2 rounded-md hover:bg-red-100" title="Save and go Home">
            <ExitIcon className="w-5 h-5"/>
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop for mobile */}
        {isNavigatorVisible && (
            <div
                onClick={() => setIsNavigatorVisible(false)}
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                aria-hidden="true"
            ></div>
        )}
        {/* Question Navigator */}
        <aside className={`fixed lg:relative inset-y-0 left-0 bg-gray-100 border-r border-gray-300 transition-transform duration-300 ease-in-out z-30
            ${isNavigatorVisible ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static w-56 lg:w-28 flex-shrink-0`}>
            <div className="p-2 overflow-hidden h-full flex flex-col">
                <div className="flex-grow overflow-y-auto">
                    <div className="flex flex-col items-center gap-2 py-2">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    onNavigate(index);
                                    setIsNavigatorVisible(false);
                                }}
                                className={`w-10 h-10 rounded-md border font-bold text-sm transition-colors flex items-center justify-center
                                  ${getQuestionStatusClass(index)}
                                  ${index === currentIndex ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`
                                }
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-3 sm:p-4 md:p-8 overflow-y-auto">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl mx-auto flex-grow flex flex-col">
            <div className="text-lg md:text-xl text-gray-800 mb-4 whitespace-pre-wrap">{currentQuestion.question}</div>
            
            <div className="space-y-4">
              {(!currentQuestion.type || currentQuestion.type === 'multiple-choice') && currentQuestion.options?.map((option, index) => {
                const isStruck = currentAnswer?.strikethroughOptions?.includes(option);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <button 
                      onClick={() => onToggleStrikethrough(option)}
                      className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0"
                      title={`Strikethrough option ${String.fromCharCode(65 + index)}`}
                      disabled={isAnswered}
                    >
                      <StrikethroughIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => !isAnswered && onSelectAnswer(option)}
                      disabled={isAnswered || isStruck}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-left w-full transition-colors duration-200 text-sm sm:text-base
                        ${isStruck ? 'line-through text-gray-400 bg-gray-100' : getOptionClasses(option)}`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                    </button>
                  </div>
                )
              })}
              {currentQuestion.type === 'true-false' && ['True', 'False'].map((option) => (
                <button
                    key={option}
                    onClick={() => !isAnswered && onSelectAnswer(option)}
                    disabled={isAnswered}
                    className={`p-4 rounded-lg border-2 text-center w-full transition-colors duration-200 ${getOptionClasses(option)}`}
                >
                    <span className="font-semibold text-lg">{option}</span>
                </button>
              ))}
            </div>

            {isAnswered && (currentQuestion.explanation || currentQuestion.reference) && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border space-y-4">
                  <button onClick={() => setShowExplanation(!showExplanation)} className="font-semibold text-blue-600 hover:underline flex items-center">
                      View Explanation & Reference
                      <svg className={`w-5 h-5 ml-1 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {showExplanation && (
                      <div className="space-y-4 pt-4 border-t text-gray-700 text-sm sm:text-base">
                          {currentQuestion.reference && <p><strong className="font-semibold">Reference:</strong> {currentQuestion.reference}</p>}
                          {currentQuestion.explanation && <p><strong className="font-semibold">Rationale:</strong> {currentQuestion.explanation}</p>}
                      </div>
                  )}
              </div>
            )}
            
          </div>

          {/* Bottom Navigation */}
          <footer className="flex-shrink-0 pt-6">
            <div className="flex justify-between items-center w-full max-w-4xl mx-auto">
              <button onClick={() => onNavigate('prev')} disabled={currentIndex === 0} className="flex items-center gap-2 bg-white text-gray-700 px-3 py-2 sm:px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow">
                <PreviousIcon />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button onClick={onToggleFlag} className="flex items-center gap-2 bg-white text-gray-700 px-3 py-2 sm:px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors shadow">
                <FlagIcon flagged={currentAnswer?.flagged} />
                <span className="hidden sm:inline">{currentAnswer?.flagged ? 'Unflag' : 'Flag'}</span>
              </button>
              {currentIndex === questions.length - 1 ? (
                <button onClick={onSubmit} className="bg-green-600 text-white px-4 py-2 sm:px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg">
                  Review & Submit
                </button>
              ) : (
                <button onClick={() => onNavigate('next')} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow">
                  <span className="hidden sm:inline">Next</span>
                  <NextIcon />
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
      {isCalculatorOpen && <Calculator onClose={() => setIsCalculatorOpen(false)} />}
    </div>
  );
};

export default ExamScreen;