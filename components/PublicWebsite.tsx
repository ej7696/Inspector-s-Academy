import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';
import api from '../services/apiService';

interface Props {
  currentUser: User | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
  onGoToDashboard: () => void;
}

const FreeSampleQuiz: React.FC<{onSignup: () => void}> = ({ onSignup }) => {
    const questions = [
        { q: "The welding performance qualification is only limited by:", a: "essential variables." },
        { q: "What type of relief device is designed to be opened by knife blades?", a: "Reverse acting rupture disk" },
        { q: "Who is responsible for implementing and executing an effective MOC process?", a: "Owner/User" }
    ];
    const [current, setCurrent] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    if (isFinished) {
        return (
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-xl font-bold text-green-800">Great Job!</h3>
                <p className="mt-2 text-green-700">You've sampled the quality of our AI-generated questions.</p>
                <button onClick={onSignup} className="mt-4 bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                    Sign Up for Free to Continue
                </button>
            </div>
        );
    }

    return (
        <div>
            <p className="text-gray-600 mb-2 font-semibold">Question {current + 1} of {questions.length}</p>
            <p className="text-lg text-gray-800 mb-4">{questions[current].q}</p>
            <div className="p-4 bg-gray-100 rounded-md">
                <p className="text-gray-500">Answer: <span className="text-gray-800 font-semibold">{questions[current].a}</span></p>
            </div>
            <button onClick={() => current < questions.length - 1 ? setCurrent(c => c+1) : setIsFinished(true)} className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                {current < questions.length - 1 ? 'Next Question' : 'Finish Sample'}
            </button>
        </div>
    );
};

const LeadMagnet: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        api.captureLead(email);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return <p className="text-center font-semibold text-green-700">Thanks! Your cheat sheet is on its way to your inbox.</p>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" required className="w-full p-3 border border-gray-300 rounded-lg"/>
             <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Download Now
             </button>
        </form>
    );
}

const PublicWebsite: React.FC<Props> = ({ currentUser, onLogin, onSignup, onLogout, onGoToDashboard }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <Logo className="h-12 w-auto" />
            </div>
            <div className="flex items-center gap-2">
                {currentUser ? (
                    <>
                        <button onClick={onGoToDashboard} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Dashboard</button>
                        <button onClick={onLogout} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Logout</button>
                    </>
                ) : (
                    <>
                        <button onClick={onLogin} className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100">Log In</button>
                        <button onClick={onSignup} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Sign Up Free</button>
                    </>
                )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative text-center py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50" aria-hidden="true"></div>
            <div className="relative">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight" style={{fontFamily: 'Montserrat, sans-serif'}}>
                    Pass Your Certification. <span className="text-blue-600">The First Time.</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Stop memorizing old questions. Start understanding the material with our AI-powered practice exams that adapt to you.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button onClick={onSignup} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-transform hover:scale-105">
                        Start for Free
                    </button>
                </div>
            </div>
        </div>

        {/* Features Section */}
         <div className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h2 className="text-3xl font-extrabold text-gray-900">Why Inspector's Academy?</h2>
                     <p className="mt-4 text-lg text-gray-600">A smarter way to prepare.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-2">Infinite Questions</h3>
                        <p className="text-gray-600">Our AI generates unique, exam-style questions every time, so you never see the same quiz twice. Master concepts, not just answers.</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-2">Realistic Simulations</h3>
                        <p className="text-gray-600">Experience the pressure of the real exam with our timed Open Book, Closed Book, and Full Simulation modes.</p>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-2">Performance Analytics</h3>
                        <p className="text-gray-600">Go beyond just a score. Pinpoint your exact weaknesses by topic and track your improvement over time.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Sample Quiz & Lead Magnet */}
        <div className="bg-white py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                 <div className="p-8 border rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Try a 3-Question Sample</h2>
                    <p className="text-gray-600 mb-6">Get a feel for the quality of our AI-generated questions. No signup required.</p>
                    <FreeSampleQuiz onSignup={onSignup} />
                 </div>
                 <div className="p-8 bg-indigo-50 border border-indigo-200 rounded-lg shadow-lg">
                     <h2 className="text-2xl font-bold text-indigo-900 mb-4">Free API 510 Cheat Sheet</h2>
                     <p className="text-indigo-800 mb-6">Get our comprehensive guide to key formulas and code references delivered to your inbox.</p>
                     <LeadMagnet />
                 </div>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Inspector's Academy. All rights reserved.</p>
            <p className="mt-2 text-gray-400">This is a demo application for educational purposes.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
