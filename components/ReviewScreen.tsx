import React, { useMemo } from 'react';
import { Question, InProgressAnswer } from '../types';

interface Props {
  questions: Question[];
  answers: InProgressAnswer[];
  onReviewQuestion: (index: number) => void;
  onFinalSubmit: () => void;
  onCancel: () => void;
}

const ReviewScreen: React.FC<Props> = ({ questions, answers, onReviewQuestion, onFinalSubmit, onCancel }) => {
    
    const summary = useMemo(() => {
        return answers.reduce((acc, answer, index) => {
            if (answer.flagged) acc.flagged.push(index);
            if (answer.userAnswer) acc.answered.push(index);
            else acc.unanswered.push(index);
            return acc;
        }, { answered: [] as number[], unanswered: [] as number[], flagged: [] as number[] });
    }, [answers]);

    const getStatusClass = (index: number) => {
        const answer = answers[index];
        const question = questions[index];
        
        if (answer.flagged) {
            return 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200';
        }
        
        if (answer.userAnswer) {
            const isCorrect = answer.userAnswer === question.answer;
            if (isCorrect) {
                return 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200';
            } else {
                return 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200';
            }
        }
        
        return 'bg-white border-gray-400 text-gray-800 hover:bg-gray-200';
    };

    const CategorySection: React.FC<{ title: string; indices: number[], color: string }> = ({ title, indices, color }) => (
        <div>
            <h3 className={`text-lg font-semibold mb-2 text-${color}-600`}>{title} ({indices.length})</h3>
            {indices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {indices.map(index => (
                        <button
                            key={index}
                            onClick={() => onReviewQuestion(index)}
                            className={`w-10 h-10 flex items-center justify-center rounded-md border font-bold text-sm transition-colors ${getStatusClass(index)}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500">None</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col p-4 md:p-8 font-sans">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto flex-grow flex flex-col">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Review</h1>
                <p className="text-gray-600 mb-6">Review your answers before final submission. Click on a question number to jump back to it.</p>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                   <CategorySection title="Flagged for Review" indices={summary.flagged} color="yellow" />
                   <CategorySection title="Unanswered" indices={summary.unanswered} color="red" />
                   <CategorySection title="Answered" indices={summary.answered} color="green" />
                </div>
                
                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                    <button 
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Return to Exam
                    </button>
                     <button 
                        onClick={onFinalSubmit}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Submit Final Answers
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewScreen;
