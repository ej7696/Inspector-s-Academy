import React from 'react';
import { SubscriptionTier, User } from '../types';

interface Props {
  user: User;
  onUpgrade: (tier: SubscriptionTier) => void;
  onCancel: () => void;
}

const Paywall: React.FC<Props> = ({ user, onUpgrade, onCancel }) => {

  const tiers = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'For a quick preview of our platform.',
      features: [
        'Access all exam categories',
        'Generate up to 5 questions per quiz',
        'Basic question formats'
      ],
      tier: 'STARTER' as SubscriptionTier,
      isCurrent: user.subscriptionTier === 'STARTER',
      isDeemphasized: true,
    },
    {
      name: "Professional",
      price: '$350 / 4 months',
      description: 'Perfect for focusing on a single, upcoming certification.',
      features: [
        'Unlimited access for one certification',
        'Generate unlimited practice questions',
        'Practice under realistic exam pressure',
        'Track progress to pinpoint weaknesses',
        'All Smart Study Tools & Virtual Tutor'
      ],
      cta: 'Upgrade to Professional',
      tier: 'PROFESSIONAL' as SubscriptionTier,
      isCurrent: user.subscriptionTier === 'PROFESSIONAL',
    },
    {
      name: "Specialist",
      price: '$650 / 4 months',
      description: 'For the multi-disciplinary inspector pursuing multiple credentials.',
      features: [
        'Unlock full access to TWO exam tracks',
        'All features from the Professional Toolkit',
        'Cross-exam weakness analysis',
        'Ideal for broader expertise',
      ],
      cta: 'Upgrade to Specialist',
      tier: 'SPECIALIST' as SubscriptionTier,
      isPopular: true,
      isCurrent: user.subscriptionTier === 'SPECIALIST',
    }
  ];

  const getContinueText = () => {
    if (user.subscriptionTier === 'STARTER') {
      return "Continue with Free Plan";
    }
    const tierName = user.subscriptionTier.charAt(0) + user.subscriptionTier.slice(1).toLowerCase();
    return `Continue with ${tierName} Plan`;
  };

  const PriceDisplay: React.FC<{ price: string }> = ({ price }) => {
    if (price === 'Free') {
      return <span className="text-4xl font-extrabold text-gray-800">Free</span>;
    }
    const parts = price.split(' / ');
    const mainPrice = parts[0];
    const period = parts.length > 1 ? `/ ${parts[1]}` : null;

    return (
      <div className="flex flex-col items-center">
        <div>
          <span className="text-2xl font-semibold text-gray-500 align-top">$</span>
          <span className="text-5xl font-extrabold text-gray-800 tracking-tight">
            {mainPrice.replace('$', '')}
          </span>
        </div>
        {period && (
          <span className="text-base font-medium text-gray-500 -mt-1">{period}</span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md md:max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all animate-fade-in-up">
        <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">Your Certification Toolkit</h2>
        <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Select the right plan to master the material, practice under pressure, and pass your exam with confidence.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`rounded-xl p-6 border transition-all duration-300
                ${tier.isPopular ? 'border-blue-500 shadow-2xl scale-105 bg-white' : 'border-gray-200'} 
                ${tier.isCurrent && !tier.isPopular ? 'bg-gray-50' : ''}
                ${tier.isDeemphasized ? 'bg-gray-50 lg:scale-95' : ''}`
              }
            >
              {tier.isPopular && (
                <div className="text-center mb-4">
                    <span className="bg-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full">BEST VALUE</span>
                </div>
              )}
              <h3 className="text-xl font-bold text-center">{tier.name}</h3>
              <p className="text-sm text-gray-500 h-12 text-center">{tier.description}</p>
              <div className="my-4 text-center h-20 flex items-center justify-center">
                 <PriceDisplay price={tier.price} />
              </div>
              <ul className="text-sm space-y-3 text-gray-600 mb-6">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {tier.cta && !tier.isCurrent && (
                <button
                  onClick={() => onUpgrade(tier.tier)}
                  className={`w-full p-3 rounded-lg font-bold text-lg transition-colors ${tier.isPopular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  {tier.cta}
                </button>
              )}
               {tier.isCurrent && tier.name !== 'Starter' && (
                 <div className="text-center p-3 rounded-lg font-bold text-lg bg-gray-200 text-gray-500 cursor-default">
                    Current Plan
                 </div>
               )}
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center border-t pt-8">
            <h3 className="text-xl font-bold text-gray-700">Trusted by Professionals</h3>
            <blockquote className="max-w-2xl mx-auto mt-4 text-gray-600 italic">
                <p>"The simulation mode was a game-changer for my API 510 exam. I walked in feeling prepared and confident, and passed on the first try."</p>
                <footer className="mt-2 text-sm font-semibold text-gray-800 not-italic">
                - John D., Certified Pressure Vessel Inspector
                </footer>
            </blockquote>
        </div>

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