import React, { useState, useEffect } from 'react';
import { SubscriptionTier, User, Testimonial } from '../types';
import api from '../services/apiService';
import PricingTiers from './PricingTiers';

interface Props {
  user: User;
  onUpgrade: (tier: SubscriptionTier) => void;
  onCancel: () => void;
}

const Paywall: React.FC<Props> = ({ user, onUpgrade, onCancel }) => {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    const testimonialsData = api.getTestimonials();
    if (testimonialsData.length > 0) {
        setTestimonial(testimonialsData[Math.floor(Math.random() * testimonialsData.length)]);
    }
  }, []);
  
  // Listen for the Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onCancel();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);


  const getContinueText = () => {
    if (user.subscriptionTier === 'STARTER') {
      return "Continue with Starter Plan";
    }
    const tierName = user.subscriptionTier.charAt(0) + user.subscriptionTier.slice(1).toLowerCase();
    return `Continue with ${tierName} Plan`;
  };
  
  return (
    <div 
        onClick={onCancel}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    >
        <div 
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the modal
            className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md md:max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all animate-fade-in-up"
        >
            <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">Your Certification Toolkit</h2>
            <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
            Select the right plan to master the material, practice under pressure, and pass your exam with confidence.
            </p>

            <PricingTiers user={user} onUpgrade={onUpgrade} />
            
            {testimonial && (
                <div className="mt-10 text-center border-t pt-8">
                    <h3 className="text-xl font-bold text-gray-700">Trusted by Professionals</h3>
                    <blockquote className="max-w-2xl mx-auto mt-4 text-gray-600 italic">
                        <p>"{testimonial.quote}"</p>
                        <footer className="mt-2 text-sm font-semibold text-gray-800 not-italic">
                        - {testimonial.author}
                        </footer>
                    </blockquote>
                </div>
            )}

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 font-semibold tracking-widest">PREPARE FOR CERTIFICATIONS FROM:</p>
                <div className="flex justify-center items-center gap-6 mt-3 text-gray-400 text-lg font-bold">
                    <span>API</span>
                    <span>AWS</span>
                    <span>SIFE / SIRE / SIEE</span>
                </div>
            </div>

            <div className="text-center mt-8">
                <button
                    className="text-sm text-gray-500 hover:underline"
                    onClick={onCancel}
                >
                    {getContinueText()}
                </button>
            </div>
        </div>
    </div>
  );
};

export default Paywall;
