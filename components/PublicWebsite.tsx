import React, { useState, useEffect } from 'react';
import { User, Testimonial } from '../types';
import Logo from './Logo';
import api from '../services/apiService';
import PricingTiers from './PricingTiers';
import VideoLightbox from './VideoLightbox';
import FreeSampleQuiz from './FreeSampleQuiz';

interface Props {
  currentUser: User | null;
  onLogout: () => void;
  onGoToDashboard: () => void;
  onNavigate: (path: string) => void;
}

const PublicWebsite: React.FC<Props> = ({ currentUser, onLogout, onGoToDashboard, onNavigate }) => {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    const testimonials = api.getTestimonials();
    if (testimonials.length > 0) {
      setTestimonial(testimonials[Math.floor(Math.random() * testimonials.length)]);
    }
  }, []);

  const certifications = [
    "API 510 - Pressure Vessel Inspector",
    "API 570 - Piping Inspector",
    "API 653 - Aboveground Storage Tank Inspector",
    "CWI - Certified Welding Inspector",
    "API 1169 - Pipeline Inspector",
    "SIFE / SIRE / SIEE"
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
                <Logo className="h-16 w-auto" />
            </div>
            <div className="flex items-center gap-2">
                {currentUser ? (
                    <>
                        <button type="button" onClick={onGoToDashboard} className="px-4 py-2 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Dashboard</button>
                        <button type="button" onClick={onLogout} className="px-4 py-2 text-base font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Logout</button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={() => onNavigate('/login')} className="px-4 py-2 text-base font-semibold text-gray-700 rounded-md hover:bg-gray-100">Log In</button>
                        <button type="button" onClick={() => onNavigate('/signup')} className="px-4 py-2 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Sign Up Free</button>
                    </>
                )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* === SECTION 1: HERO (ATTENTION) === */}
        <div className="relative text-center py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
            <div className="relative">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight" style={{fontFamily: 'Montserrat, sans-serif'}}>
                    Stop Memorizing. Start Mastering. <br />
                    <span className="text-blue-600">The Last Practice Exam You'll Ever Need.</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Our Dynamic Question Engine builds a new, unique set of realistic questions for every practice session, so you can walk into your test with absolute confidence.
                </p>

                {/* --- Explainer Video --- */}
                <div className="mt-6 max-w-2xl mx-auto">
                    <div 
                        onClick={() => setIsVideoOpen(true)} 
                        className="relative rounded-lg shadow-2xl cursor-pointer group overflow-hidden aspect-video"
                    >
                        <img 
                            src="https://i.ibb.co/wJ3d6V2/thumbnail.png" 
                            alt="Explainer video thumbnail" 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-4 relative z-10">
                    <button type="button" onClick={() => onNavigate('/signup')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-transform hover:scale-105">
                        Start Practicing for Free
                    </button>
                </div>
            </div>
        </div>

        {/* === NEW SECTION: CERTIFICATION SHOWCASE === */}
        <div className="py-8 bg-slate-50 border-y">
            <div className="max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-lg font-semibold text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Comprehensive Practice for the Certifications That Define Your Career
                </h2>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {certifications.map(cert => (
                        <span key={cert} className="bg-slate-200 text-slate-800 text-sm font-bold px-4 py-2 rounded-full">
                            {cert}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        {/* === SECTION 2: PROBLEM/SOLUTION (INTEREST) === */}
        <div className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="p-6 border-2 border-red-200 rounded-lg">
                        <h3 className="text-2xl font-bold text-red-800 mb-4">The Old Way</h3>
                        <ul className="space-y-3 text-red-700">
                            <li className="flex items-start"><span className="text-red-500 font-bold mr-3">✗</span> Relying on outdated PDF dumps & static questions</li>
                            <li className="flex items-start"><span className="text-red-500 font-bold mr-3">✗</span> Risking failure by just memorizing answers</li>
                            <li className="flex items-start"><span className="text-red-500 font-bold mr-3">✗</span> Having no feedback on your actual weak spots</li>
                            <li className="flex items-start"><span className="text-red-500 font-bold mr-3">✗</span> Wasting time and money on expensive re-test fees</li>
                        </ul>
                    </div>
                    <div className="p-6 border-2 border-green-300 rounded-lg bg-green-50">
                         <h3 className="text-2xl font-bold text-green-800 mb-4">The Smart Way</h3>
                        <ul className="space-y-3 text-green-900">
                            <li className="flex items-start"><span className="text-green-500 font-bold mr-3">✓</span> Always-current questions from the latest source material</li>
                            <li className="flex items-start"><span className="text-green-500 font-bold mr-3">✓</span> Master concepts with a unique quiz every time</li>
                            <li className="flex items-start"><span className="text-green-500 font-bold mr-3">✓</span> Instantly pinpoint and fix your weaknesses</li>
                            <li className="flex items-start"><span className="text-green-500 font-bold mr-3">✓</span> Pass with confidence, the first time</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        {/* === NEW SECTION: FREE SAMPLE QUIZ === */}
        <div className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Try it Now. No Signup Required.</h2>
                <p className="mt-4 text-lg text-gray-600">Experience the quality of our Dynamic Question Engine with this free 3-question sample quiz.</p>
                <div className="mt-8">
                    <FreeSampleQuiz onSignup={() => onNavigate('/signup')} />
                </div>
            </div>
        </div>

        {/* === SECTION 3: FEATURE BREAKDOWN (DESIRE) === */}
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-gray-900">Dynamic Question Engine</h3>
                        <p className="mt-4 text-lg text-gray-600">Master Concepts, Not Just Answers. Our platform constructs a unique quiz for you in real-time, pulling directly from the official code books. This proven method forces you to truly understand the material, preventing the dangerous habit of simply memorizing a static list of old questions.</p>
                    </div>
                    <img src="https://i.ibb.co/yBYW8g7/dynamic-engine.png" alt="Dynamic questions being generated" className="rounded-lg shadow-lg" />
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <img src="https://i.ibb.co/RSCt8s3/feature2.png" alt="Timed exam simulation interface" className="rounded-lg shadow-lg lg:order-last" />
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-gray-900">Practice Under Real Exam Pressure</h3>
                        <p className="mt-4 text-lg text-gray-600">Go beyond simple practice. Our timed Simulation Mode replicates the intensity of the real exam, testing your knowledge from memory and your ability to navigate code books under a ticking clock.</p>
                    </div>
                 </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="p-4">
                        <h3 className="text-3xl font-extrabold text-gray-900">Find and Fix Your Weaknesses, Instantly</h3>
                        <p className="mt-4 text-lg text-gray-600">Stop guessing where you're weak. Our Performance Dashboard instantly analyzes your results, pinpoints your exact knowledge gaps by topic, and lets you launch a targeted quiz to turn those weak spots into strengths.</p>
                    </div>
                    <img src="https://i.ibb.co/b3y5k2H/feature3.png" alt="Performance dashboard showing weakness analysis" className="rounded-lg shadow-lg" />
                 </div>
            </div>
        </div>

        {/* === SECTION 4: SOCIAL PROOF (DESIRE) === */}
        {testimonial && (
            <div className="bg-gray-50 py-16">
                 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <img src="https://i.ibb.co/Q8QvV9w/testimonial-avatar.png" alt="User testimonial photo" className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <blockquote className="text-xl text-gray-700 italic">
                        "{testimonial.quote}"
                    </blockquote>
                    <footer className="mt-4 font-bold text-gray-900">- {testimonial.author}</footer>
                 </div>
            </div>
        )}
        
        {/* === SECTION 5: PRICING & CTA (ACTION) === */}
        <div className="bg-white py-16">
             <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                     <h2 className="text-3xl font-extrabold text-gray-900">Ready to Pass With Confidence?</h2>
                     <p className="mt-4 text-lg text-gray-600">Start for free today. Upgrade when you're ready for unlimited access.</p>
                 </div>
                <PricingTiers user={{ subscriptionTier: 'STARTER' } as User} onUpgrade={() => onNavigate('/signup')} />
             </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Inspector's Academy. All rights reserved.</p>
        </div>
      </footer>

      {isVideoOpen && <VideoLightbox videoSrc="https://storage.googleapis.com/aistudio-hosting/generative-ai/e8334812-a72f-48ca-9174-89fc1a7a0273/explainer_video.mp4" onClose={() => setIsVideoOpen(false)} />}
    </div>
  );
};

export default PublicWebsite;