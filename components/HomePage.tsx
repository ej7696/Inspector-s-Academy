import React, { useState, useEffect, useMemo } from 'react';
import { User, InProgressQuizState, Exam, Announcement } from '../types';
import api from '../services/apiService';
import ProgressRing from './ProgressRing';

interface Props {
  user: User;
  onStartQuiz: (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => void;
  onViewDashboard: () => void;
  onViewProfile: () => void;
  onViewAdmin: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onResumeQuiz: (progress: InProgressQuizState) => void;
  onAbandonQuiz: () => void;
}

const HomePage: React.FC<Props> = ({ 
  user, onStartQuiz, onViewDashboard, onViewProfile, onViewAdmin, onLogout, onUpgrade, onResumeQuiz, onAbandonQuiz 
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [customTopics, setCustomTopics] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examData, announcementData] = await Promise.all([
          api.getExams(),
          api.getAnnouncements()
        ]);
        setExams(examData.filter(e => e.isActive));
        setAnnouncements(announcementData.filter(a => a.isActive));
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter(exam =>
      exam.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exams, searchTerm]);

  const handleActionClick = () => {
    if (selectedExam) {
      onStartQuiz(selectedExam.name, numQuestions, isTimedMode, customTopics.trim());
    }
  };
  
  const getButtonProps = () => {
    const isPaid = user.subscriptionTier !== 'Cadet';
    if (!selectedExam) {
      return { text: 'Select an Exam', disabled: true };
    }
    const isUnlocked = user.unlockedExams.includes(selectedExam.name);
    if (isPaid && !isUnlocked) {
      return { text: 'Unlock & Start Quiz', disabled: false };
    }
    return { text: 'Start Quiz', disabled: false };
  };

  const { text: buttonText, disabled: isButtonDisabled } = getButtonProps();

  const getTierColor = (tier: string) => {
    switch (tier) {
        case 'Specialist': return 'bg-green-100 text-green-800';
        case 'Professional': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMasteryScore = (examName: string) => {
      const relevantHistory = user.history.filter(h => h.examName === examName);
      if (relevantHistory.length === 0) return 0;
      return Math.max(...relevantHistory.map(h => h.percentage));
  };


  if (isLoading) {
    return <div className="text-center p-10">Loading exams...</div>;
  }
  
  if (user.inProgressQuiz) {
    return (
        <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Resume Your Session?</h2>
            <p className="text-gray-600 mb-6">
                You have an in-progress quiz for "{user.inProgressQuiz.quizSettings.examName}".
            </p>
            <div className="flex justify-center gap-4">
                <button onClick={() => onResumeQuiz(user.inProgressQuiz!)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">
                    Resume Quiz
                </button>
                <button onClick={onAbandonQuiz} className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition-colors">
                    Abandon & Start New
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
            {announcements.length > 0 ? (
                <div className="flex-grow bg-indigo-600 text-white p-4 rounded-lg text-center shadow-lg">
                    <p className="font-semibold">{announcements[0].message}</p>
                </div>
            ) : (
                <div className="flex-grow"></div> 
            )}
             <button 
                onClick={onLogout} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
            >
                LogOut
            </button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.fullName || user.email}!</h1>
                </div>
                <p className="text-gray-500">Select a certification to start practicing.</p>
              </div>
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${getTierColor(user.subscriptionTier)}`}>
              {user.subscriptionTier} Plan
            </div>
          </div>
          <input
            type="text"
            placeholder="Search for an exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          />
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <ul className="space-y-3">
              {filteredExams.map((exam) => {
                const isUnlocked = user.unlockedExams.includes(exam.name);
                const isSelected = selectedExam?.id === exam.id;
                const mastery = getMasteryScore(exam.name);

                return (
                  <li
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className={`p-4 flex items-center justify-between rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div>
                        <p className="font-semibold text-lg text-gray-800">{exam.name}</p>
                        <p className="text-sm text-gray-500">Master your certification exam.</p>
                    </div>
                    {user.subscriptionTier !== 'Cadet' && (
                       isUnlocked ? (
                         <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <ProgressRing score={mastery} />
                            <span>Unlocked</span>
                         </div>
                       ) : (
                         <div className="text-sm text-gray-500 font-medium flex items-center gap-1">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                           <span>Locked</span>
                         </div>
                       )
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz Settings</h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Questions: {numQuestions}</label>
                        <input type="range" min="5" max="120" step="5" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" disabled={!selectedExam}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Focus on Specific Topics (Optional)</label>
                        <input type="text" placeholder="e.g., welding, NDE, corrosion" value={customTopics} onChange={e => setCustomTopics(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" disabled={!selectedExam || user.subscriptionTier === 'Cadet'}/>
                        {user.subscriptionTier === 'Cadet' && <p className="text-xs text-gray-500 mt-1">Upgrade to a paid plan to use this feature.</p>}
                    </div>
                    <div className="flex items-center justify-between">
                         <label className="text-sm font-medium text-gray-700">Enable Timed Mode</label>
                         <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" checked={isTimedMode} onChange={() => setIsTimedMode(!isTimedMode)} disabled={!selectedExam} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                    </div>
                    <button onClick={handleActionClick} disabled={isButtonDisabled} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {buttonText}
                    </button>
                </div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Account</h2>
                <div className="space-y-3">
                    <button onClick={onViewProfile} className="w-full text-left py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium">My Profile</button>
                    <button onClick={onViewDashboard} className="w-full text-left py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium">Performance Dashboard</button>
                    {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                        <button onClick={onViewAdmin} className="w-full text-left py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition font-medium">Admin Panel</button>
                    )}
                    <button onClick={onUpgrade} className="w-full text-left py-2 px-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition font-medium">Upgrade Plan</button>
                </div>
            </div>
        </div>
      </div>
       <style>{`
          .toggle-checkbox:checked { right: 0; border-color: #2563EB; }
          .toggle-checkbox:checked + .toggle-label { background-color: #2563EB; }
       `}</style>
    </div>
  );
};

export default HomePage;