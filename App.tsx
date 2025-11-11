import React, { useState, useEffect } from 'react';
import { User, Question, QuizSettings, InProgressAnswer, UserAnswer, QuizResult, InProgressQuizState, SubscriptionTier } from './types';
import api from './services/apiService';

import Login from './components/Login';
import HomePage from './components/HomePage';
import ExamModeSelector from './components/ExamModeSelector';
import InstructionsModal from './components/InstructionsModal';
import ExamScreen from './components/ExamScreen';
import ReviewScreen from './components/ReviewScreen';
import ScoreScreen from './components/ScoreScreen';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import Paywall from './components/Paywall';
import InfoDialog from './components/InfoDialog';
import ExamUnlockSelector from './components/ExamUnlockSelector';
import PublicWebsite from './components/PublicWebsite';
import OnboardingTour from './components/OnboardingTour';

type View = 'login' | 'home' | 'select_mode' | 'instructions' | 'quiz' | 'review' | 'score' | 'dashboard' | 'profile' | 'admin' | 'paywall' | 'select_unlocked_exams';
type AuthModal = 'login' | 'signup' | null;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorInfo, setErrorInfo] = useState<{title: string, message: string} | null>(null);
  
  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [inProgressAnswers, setInProgressAnswers] = useState<InProgressAnswer[]>([]);
  const [closedBookAnswers, setClosedBookAnswers] = useState<InProgressAnswer[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isSimulationIntermission, setIsSimulationIntermission] = useState(false);
  const [quizPart, setQuizPart] = useState<'closed' | 'open'>('closed');
  const [startTime, setStartTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // B2C Growth State
  const [examToPurchase, setExamToPurchase] = useState<{name: string, price: string} | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [postLoginAction, setPostLoginAction] = useState<(() => void) | null>(null);

  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  useEffect(() => {
    api.initializeData();
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);

  const resetQuizState = () => {
    setQuestions([]);
    setQuizSettings(null);
    setInProgressAnswers([]);
    setClosedBookAnswers(null);
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setIsSimulationIntermission(false);
    setQuizPart('closed');
    setStartTime(0);
    setTimeRemaining(0);
    setFollowUpAnswer('');
    setIsFollowUpLoading(false);
    setExamToPurchase(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthModal(null);
    
    if (user.isNewUser) {
        setShowOnboarding(true);
    }

    if (postLoginAction) {
        postLoginAction();
        setPostLoginAction(null);
    } else {
        setCurrentView('home');
    }
  };

  const handleLogout = () => {
    if (originalUser) {
      // Stop impersonating
      api.login(originalUser.email, originalUser.password!).then(user => {
        setCurrentUser(user);
        setOriginalUser(null);
        setCurrentView('admin');
      });
    } else {
      api.logout();
      setCurrentUser(null);
      setOriginalUser(null);
      // This will automatically render the PublicWebsite
      resetQuizState();
    }
  };

  const handleStartQuiz = (examName: string, numQuestions: number, isTimed: boolean, topics?: string) => {
    let finalNumQuestions = numQuestions; // Default for paid users

    if (currentUser?.subscriptionTier === 'STARTER') {
      const perExamLimit = 2;
      const usageForExam = currentUser.monthlyExamUsage?.[examName] || 0;
      const remainingForExam = Math.max(0, perExamLimit - usageForExam);
      const totalMonthlyRemaining = currentUser.monthlyQuestionRemaining ?? 0;
      
      finalNumQuestions = Math.min(totalMonthlyRemaining, remainingForExam);

      if (finalNumQuestions <= 0) {
        setErrorInfo({
          title: 'Question Limit Reached',
          message: `You have no more sample questions available for "${examName}" this month. Please try another exam or upgrade for unlimited access.`
        });
        return;
      }
    }

    // Enforce lock status for paid tiers
    if (currentUser && (currentUser.subscriptionTier === 'PROFESSIONAL' || currentUser.subscriptionTier === 'SPECIALIST')) {
      if (!currentUser.subscriptionExpiresAt || Date.now() > currentUser.subscriptionExpiresAt) {
        setErrorInfo({ title: 'Subscription Expired', message: 'Your subscription has expired. Please renew your plan to continue practicing.' });
        return;
      }
      if (!currentUser.unlockedExams.includes(examName)) {
        setErrorInfo({ title: 'Exam Locked', message: `This exam is not unlocked on your current plan. Please select an unlocked exam.` });
        return;
      }
    }

    setQuizSettings({ examName, numQuestions: finalNumQuestions, isTimed, topics, examMode: 'open' }); // default to open, will be set in next screen
    setCurrentView('select_mode');
  };

  const handleSelectExamMode = (mode: 'open' | 'closed' | 'simulation') => {
    if (!quizSettings) return;
    const newSettings = { ...quizSettings, examMode: mode };
    setQuizSettings(newSettings);
    setCurrentView('instructions');
  };

  const generateAndStartQuiz = async (settings: QuizSettings) => {
    if (currentUser?.subscriptionTier === 'STARTER') {
      const refreshedUser = api.checkAndResetMonthlyLimits(currentUser);
      if (refreshedUser !== currentUser) {
        setCurrentUser(refreshedUser);
      }
      const monthlyRemaining = refreshedUser.monthlyQuestionRemaining || 0;
      if (settings.numQuestions > monthlyRemaining) {
        setErrorInfo({ title: 'Question Limit Reached', message: `You only have ${monthlyRemaining} questions remaining this month. Please select a smaller quiz size or upgrade your plan.`});
        return;
      }
      const usageForExam = refreshedUser.monthlyExamUsage?.[settings.examName] || 0;
      const perExamLimit = 2;
      if (usageForExam + settings.numQuestions > perExamLimit) {
         setErrorInfo({ title: 'Question Limit Exceeded', message: `You can only take ${perExamLimit - usageForExam} more question(s) for the "${settings.examName}" exam this month.`});
        return;
      }
      const updatedUser = api.recordStarterUsage(currentUser.id, settings.examName, settings.numQuestions);
      setCurrentUser(updatedUser);
    }

    setIsLoading(true);
    setLoadingMessage(`Generating ${settings.numQuestions} questions for your ${settings.examName} exam... This may take a minute.`);
    try {
      const generatedQuestions = await api.generateQuestions(settings.examName, settings.numQuestions, settings.topics);
      if (generatedQuestions.length === 0) throw new Error("The model didn't return any questions. Please try again.");

      setQuestions(generatedQuestions);
      setInProgressAnswers(generatedQuestions.map(() => ({ userAnswer: null, flagged: false, strikethroughOptions: [] })));
      setQuizSettings(settings);
      setCurrentQuestionIndex(0);
      setQuizPart('closed');
      setStartTime(Date.now());
      setTimeRemaining(settings.isTimed ? settings.numQuestions * 90 : 0);
      setCurrentView('quiz');
    } catch (error: any) {
      setErrorInfo({ title: 'Quiz Generation Failed', message: error.message || 'An unknown error occurred while generating questions. The model might be unavailable. Please try again.' });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleResumeQuiz = (progress: InProgressQuizState) => {
      setQuestions(progress.questions);
      setInProgressAnswers(progress.answers);
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      setQuizSettings(progress.quizSettings);
      setStartTime(progress.startTime);
      setTimeRemaining(progress.timeRemaining);
      setIsSimulationIntermission(progress.isSimulationIntermission);
      setQuizPart(progress.isSimulationIntermission ? 'closed' : 'open');
      setCurrentView('quiz');
  };

  const handleAutoSave = (answers: InProgressAnswer[], time: number) => {
    if (!currentUser || !quizSettings) return;
    const progress: InProgressQuizState = { questions, answers, currentQuestionIndex, quizSettings, startTime, timeRemaining: time, isSimulationIntermission };
    api.updateUser(currentUser.id, { inProgressQuiz: progress }, true);
  };

  const handleSaveAndExit = (time: number) => {
      if (!currentUser || !quizSettings) return;
      const progress: InProgressQuizState = { questions, answers: inProgressAnswers, currentQuestionIndex, quizSettings, startTime, timeRemaining: time, isSimulationIntermission };
      const updatedUser = api.updateUser(currentUser.id, { inProgressQuiz: progress });
      setCurrentUser(updatedUser);
      setCurrentView('home');
      resetQuizState();
  };

  const handleAbandonQuiz = () => {
    if (!currentUser) return;
    const updatedUser = api.updateUser(currentUser.id, { inProgressQuiz: null });
    setCurrentUser(updatedUser);
    resetQuizState();
  };
  
  const handleNavigate = (destination: 'next' | 'prev' | number) => {
      if (typeof destination === 'number') setCurrentQuestionIndex(destination);
      else {
          const newIndex = destination === 'next' ? currentQuestionIndex + 1 : currentQuestionIndex - 1;
          if (newIndex >= 0 && newIndex < questions.length) setCurrentQuestionIndex(newIndex);
      }
      setFollowUpAnswer('');
  };

  const handleSelectAnswer = (answer: string) => {
      setInProgressAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = { ...newAnswers[currentQuestionIndex], userAnswer: answer };
          return newAnswers;
      });
  };

  const handleToggleFlag = () => {
      setInProgressAnswers(prev => {
          const newAnswers = [...prev];
          const current = newAnswers[currentQuestionIndex];
          newAnswers[currentQuestionIndex] = { ...current, flagged: !current.flagged };
          return newAnswers;
      });
  };

  const handleToggleStrikethrough = (option: string) => {
      setInProgressAnswers(prev => {
          const newAnswers = [...prev];
          const current = newAnswers[currentQuestionIndex];
          const existingStruck = current.strikethroughOptions || [];
          const newStruck = existingStruck.includes(option) ? existingStruck.filter(o => o !== option) : [...existingStruck, option];
          newAnswers[currentQuestionIndex] = { ...current, strikethroughOptions: newStruck };
          return newAnswers;
      });
  };

  const handleSubmitQuiz = () => {
    if (quizSettings?.examMode === 'simulation' && quizPart === 'closed') {
        setClosedBookAnswers(inProgressAnswers);
        setIsSimulationIntermission(true);
        setCurrentQuestionIndex(0);
        setInProgressAnswers(prev => prev.map(a => ({...a, userAnswer: null, flagged: false, strikethroughOptions: []})));
        return;
    }
    setCurrentView('review');
  };

  const handleStartOpenBookSection = () => {
    setIsSimulationIntermission(false);
    setQuizPart('open');
    setTimeRemaining(quizSettings?.isTimed ? questions.length * 90 : 0);
  };
  
  const handleFinalSubmit = () => {
    if (!currentUser || !quizSettings) return;

    let userAnswers: UserAnswer[];
    let score: number;
    let totalQuestions: number;
    let finalExamName = quizSettings.examName;

    if (quizSettings.examMode === 'simulation' && closedBookAnswers) {
      const closedBookUserAnswers: UserAnswer[] = questions.map((q, i) => ({ question: `(Closed Book) ${q.question}`, options: q.options, answer: q.answer, userAnswer: closedBookAnswers[i].userAnswer || 'Not Answered', isCorrect: q.answer === closedBookAnswers[i].userAnswer, category: q.category }));
      const openBookUserAnswers: UserAnswer[] = questions.map((q, i) => ({ question: `(Open Book) ${q.question}`, options: q.options, answer: q.answer, userAnswer: inProgressAnswers[i].userAnswer || 'Not Answered', isCorrect: q.answer === inProgressAnswers[i].userAnswer, category: q.category }));
      userAnswers = [...closedBookUserAnswers, ...openBookUserAnswers];
      score = userAnswers.filter(a => a.isCorrect).length;
      totalQuestions = userAnswers.length;
      finalExamName = `${quizSettings.examName} (Simulation)`;
    } else {
      userAnswers = questions.map((q, i) => ({ question: q.question, options: q.options, answer: q.answer, userAnswer: inProgressAnswers[i].userAnswer || 'Not Answered', isCorrect: q.answer === inProgressAnswers[i].userAnswer, category: q.category }));
      score = userAnswers.filter(a => a.isCorrect).length;
      totalQuestions = questions.length;
    }

    const result: QuizResult = {
      id: `result-${Date.now()}`, userId: currentUser.id, examName: finalExamName, score, totalQuestions,
      percentage: totalQuestions > 0 ? (score / totalQuestions) * 100 : 0, date: Date.now(), userAnswers,
    };
      
    setQuizResult(result);
    const updatedHistory = [...currentUser.history, result];
    const updatedUser = api.updateUser(currentUser.id, { history: updatedHistory, inProgressQuiz: null });
    setCurrentUser(updatedUser);
    setCurrentView('score');
    api.logActivity('quiz_complete', `scored ${result.percentage.toFixed(1)}% on ${finalExamName}.`, currentUser.id, currentUser.email);
  };
  
  const handleAskFollowUp = async (question: Question, query: string) => {
    setIsFollowUpLoading(true); setFollowUpAnswer('');
    try {
      const answer = await api.getFollowUpAnswer(question, query);
      setFollowUpAnswer(answer);
    } catch (error: any) {
      setFollowUpAnswer(`Error: ${error.message}`);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = api.updateUser(currentUser.id, updates);
    setCurrentUser(updatedUser);
  };
  
  const handleImpersonate = (userToImpersonate: User) => {
    if (!currentUser) return;
    setOriginalUser(currentUser);
    setCurrentUser(userToImpersonate);
    setCurrentView('home');
  };
  
  const handleUpgrade = (tier: SubscriptionTier) => {
    if (!currentUser) {
        setPostLoginAction(() => () => handleUpgrade(tier));
        setAuthModal('signup');
        return;
    }
    api.logActivity('view_paywall', 'viewed the upgrade options.', currentUser.id, currentUser.email);
    const slots = tier === 'PROFESSIONAL' ? 1 : tier === 'SPECIALIST' ? 2 : 0;
    if (slots === 0) return;
    
    const updatedUser = api.upgradeSubscription(currentUser.id, tier, slots);
    setCurrentUser(updatedUser);
    setCurrentView('select_unlocked_exams');
  };

  const handleInitiateUnlockPurchase = (examName: string, price: string) => setExamToPurchase({ name: examName, price });
  
  const handleConfirmUnlockPurchase = () => {
    if (!currentUser) return;
    const updatedUser = api.purchaseAdditionalUnlock(currentUser.id);
    setCurrentUser(updatedUser);
    setExamToPurchase(null);
    setCurrentView('select_unlocked_exams');
  };

  const handleConfirmUnlock = (selectedExamNames: string[]) => {
    if (!currentUser) return;
    const currentUnlocked = currentUser.unlockedExams || [];
    const newUnlocked = [...new Set([...currentUnlocked, ...selectedExamNames])];
    const updatedUser = api.updateUser(currentUser.id, { unlockedExams: newUnlocked });
    setCurrentUser(updatedUser);
    setCurrentView('home');
  };

  const renderLoggedInContent = () => {
    switch (currentView) {
      case 'home': return <HomePage user={currentUser!} onStartQuiz={handleStartQuiz} onViewDashboard={() => setCurrentView('dashboard')} onViewProfile={() => setCurrentView('profile')} onViewAdmin={() => setCurrentView('admin')} onLogout={handleLogout} onUpgrade={() => { api.logActivity('view_paywall', 'viewed upgrade options.', currentUser!.id, currentUser!.email); setCurrentView('paywall');}} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} onInitiateUnlockPurchase={handleInitiateUnlockPurchase} />;
      case 'select_mode': return <ExamModeSelector examName={quizSettings!.examName} onSelectMode={handleSelectExamMode} onGoHome={() => { resetQuizState(); setCurrentView('home'); }} />;
      case 'instructions': const exam = api.getExams().find(e => e.name === quizSettings!.examName); return <InstructionsModal examName={quizSettings!.examName} bodyOfKnowledge={exam?.bodyOfKnowledge || 'No details available.'} onStart={() => generateAndStartQuiz(quizSettings!)} onCancel={() => setCurrentView('select_mode')} />;
      case 'quiz': return <>{isSimulationIntermission && <InfoDialog open={true} title="Closed Book Section Complete" message="You will now proceed to the Open Book portion of the exam. You will be presented with the same set of questions, but now you can use your reference materials to answer them. The timer will reset for this section." buttons={[{ text: "Start Open Book Section", style: 'primary', onClick: handleStartOpenBookSection }]} />}<ExamScreen key={quizPart} user={currentUser!} questions={questions} quizSettings={quizSettings!} currentIndex={currentQuestionIndex} answers={inProgressAnswers} onSelectAnswer={handleSelectAnswer} onNavigate={handleNavigate} onToggleFlag={handleToggleFlag} onToggleStrikethrough={handleToggleStrikethrough} onSubmit={handleSubmitQuiz} onSaveAndExit={handleSaveAndExit} onAutoSave={handleAutoSave} onAskFollowUp={handleAskFollowUp} followUpAnswer={followUpAnswer} isFollowUpLoading={isFollowUpLoading} /></>;
      case 'review': return <ReviewScreen questions={questions} answers={inProgressAnswers} onReviewQuestion={(index) => { setCurrentQuestionIndex(index); setCurrentView('quiz'); }} onFinalSubmit={handleFinalSubmit} onCancel={() => setCurrentView('quiz')} />;
      case 'score': return <ScoreScreen result={quizResult!} onRestart={() => handleStartQuiz(quizResult!.examName, quizResult!.totalQuestions, quizSettings?.isTimed || false, quizSettings?.topics)} onGoHome={() => { resetQuizState(); setCurrentView('home'); }} isPro={currentUser!.subscriptionTier !== 'STARTER'} onViewDashboard={() => setCurrentView('dashboard')} onRegenerate={() => { resetQuizState(); handleStartQuiz(quizResult!.examName, 120, true);}} />;
      case 'dashboard': return <Dashboard user={currentUser!} onGoHome={() => setCurrentView('home')} onStartWeaknessQuiz={(topics) => handleStartQuiz(currentUser!.unlockedExams[0] || 'API 510', 20, false, topics)} onUpgrade={() => { api.logActivity('view_paywall', 'viewed upgrade options.', currentUser!.id, currentUser!.email); setCurrentView('paywall');}} />;
      case 'profile': return <UserProfile user={currentUser!} onUpdateUser={handleUpdateUser} onGoHome={() => setCurrentView('home')} onViewDashboard={() => setCurrentView('dashboard')} onManageSubscription={() => setCurrentView('paywall')} />;
      case 'admin': return <AdminDashboard onGoHome={() => setCurrentView('home')} currentUser={currentUser!} onImpersonate={handleImpersonate} />;
      case 'paywall': return <Paywall user={currentUser!} onUpgrade={handleUpgrade} onCancel={() => setCurrentView('home')} />;
      case 'select_unlocked_exams': return <ExamUnlockSelector user={currentUser!} onConfirmUnlock={handleConfirmUnlock} onCancel={() => setCurrentView('home')} />;
      default: return <HomePage user={currentUser!} onStartQuiz={handleStartQuiz} onViewDashboard={() => setCurrentView('dashboard')} onViewProfile={() => setCurrentView('profile')} onViewAdmin={() => setCurrentView('admin')} onLogout={handleLogout} onUpgrade={() => setCurrentView('paywall')} onResumeQuiz={handleResumeQuiz} onAbandonQuiz={handleAbandonQuiz} onInitiateUnlockPurchase={handleInitiateUnlockPurchase} />;
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold">{loadingMessage || 'Loading Application...'}</div>;
  }
  
  return (
    <>
      {originalUser && (
        <div className="bg-yellow-400 text-black text-center p-2 font-semibold">
          You are impersonating {currentUser?.email}. 
          <button onClick={handleLogout} className="underline ml-2 font-bold">Return to Admin</button>
        </div>
      )}
      {errorInfo && ( <InfoDialog open={true} title={errorInfo.title} message={errorInfo.message} buttons={[{ text: 'Return to Home', style: 'primary', onClick: () => { setErrorInfo(null); resetQuizState(); setCurrentView('home'); }}]} /> )}
      {examToPurchase && currentUser && ( <InfoDialog open={true} title="Confirm Purchase" message={`You are about to purchase access to the "${examToPurchase.name}" certification track for ${examToPurchase.price}." This is a one-time, non-refundable charge.`} buttons={[{ text: 'Cancel', style: 'neutral', onClick: () => setExamToPurchase(null) }, { text: 'Confirm Purchase', style: 'primary', onClick: handleConfirmUnlockPurchase }]} /> )}
      
      {!currentUser ? (
        <>
            <PublicWebsite 
                currentUser={null}
                onLogin={() => setAuthModal('login')}
                onSignup={() => setAuthModal('signup')}
                onLogout={handleLogout} // for completeness
                onGoToDashboard={() => setCurrentView('home')} // for completeness
            />
            {authModal === 'login' && <Login onLoginSuccess={handleLoginSuccess} isModal onCancel={() => setAuthModal(null)} />}
            {authModal === 'signup' && <Login onLoginSuccess={handleLoginSuccess} isModal onCancel={() => setAuthModal(null)} />}
        </>
      ) : (
        <>
            {showOnboarding && <OnboardingTour user={currentUser!} onComplete={() => setShowOnboarding(false)} />}
            {renderLoggedInContent()}
        </>
      )}
    </>
  );
};

export default App;
