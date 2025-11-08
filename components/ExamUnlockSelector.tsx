import React, { useState, useEffect } from 'react';
import { User, Exam } from '../types';
import api from '../services/apiService';

interface Props {
  user: User;
  onConfirmUnlock: (selectedExamNames: string[]) => void;
  onCancel: () => void;
}

const ExamUnlockSelector: React.FC<Props> = ({ user, onConfirmUnlock, onCancel }) => {
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unlockLimit = user.paidUnlockSlots - user.unlockedExams.length;
  const tierName = user.subscriptionTier.charAt(0) + user.subscriptionTier.slice(1).toLowerCase();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examData = await api.getExams();
        // Filter out exams that are not active or already unlocked by the user
        setAllExams(examData.filter(e => e.isActive && !user.unlockedExams.includes(e.name)));
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, [user.unlockedExams]);

  const handleToggle = (examName: string) => {
    setSelectedExams(prev => {
      if (prev.includes(examName)) {
        return prev.filter(name => name !== examName);
      }
      if (prev.length < unlockLimit) {
        return [...prev, examName];
      }
      return prev; // Do not add more than the limit
    });
  };
  
  const isSelectionComplete = selectedExams.length === unlockLimit;

  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Loading Exams...</h2>
            <div className="mt-4 w-32 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-blue-600 animate-pulse w-full"></div>
            </div>
         </div>
      );
    }
    return (
      <>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unlock Your Exam Access</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the {tierName} plan! Please select {unlockLimit} exam(s) to unlock.
        </p>

        <div className="flex-grow border-t border-b py-4 my-4 overflow-y-auto space-y-3 pr-2">
          {allExams.length > 0 ? allExams.map(exam => {
            const isSelected = selectedExams.includes(exam.name);
            const isDisabled = !isSelected && selectedExams.length >= unlockLimit;
            return (
              <label 
                key={exam.id} 
                className={`flex items-center p-4 rounded-lg border-2 transition-all 
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  ${!isDisabled && !isSelected ? 'hover:bg-gray-50' : ''}`
                }>
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleToggle(exam.name)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-4 font-semibold text-gray-700">{exam.name}</span>
              </label>
            );
          }) : (
              <p className="text-center text-gray-500">No new exams available to unlock.</p>
          )}
        </div>
        
        <p className="text-center font-semibold text-gray-700">
          {selectedExams.length} / {unlockLimit} selected
        </p>

        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">
            Cancel
          </button>
          <button 
            onClick={() => onConfirmUnlock(selectedExams)} 
            disabled={!isSelectionComplete}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            Confirm and Start Practicing
          </button>
        </div>
      </>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExamUnlockSelector;