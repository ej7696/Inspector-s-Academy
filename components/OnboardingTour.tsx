import React, { useState } from 'react';
import { User } from '../types';
import api from '../services/apiService';

interface Props {
  user: User;
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Inspector's Academy!",
    content: "Let's take a quick tour to get you started on your certification journey."
  },
  {
    title: "Step 1: Select Your Exam",
    content: "Choose any of the available certifications from the list. As a Starter, you can explore them all."
  },
  {
    title: "Step 2: Start a Sample Quiz",
    content: "Your plan includes a 2-question sample for each certification to give you a feel for our AI-generated questions. Use the 'Quiz Settings' to begin."
  },
  {
    title: "Ready for Full Access?",
    content: "When you're ready to unlock unlimited questions, simulation modes, and performance analytics, just click 'Upgrade Plan'."
  }
];

const OnboardingTour: React.FC<Props> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      api.updateUser(user.id, { isNewUser: false });
      onComplete();
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{steps[currentStep].title}</h2>
        <p className="text-gray-600 mb-8">{steps[currentStep].content}</p>
        
        <div className="flex items-center justify-center mb-6">
            {steps.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full mx-1 ${index === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            ))}
        </div>

        <button 
          onClick={handleNext} 
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
        >
          {isLastStep ? "Let's Get Started!" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default OnboardingTour;
