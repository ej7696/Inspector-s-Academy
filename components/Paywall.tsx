import React from 'react';
import { SubscriptionTier } from '../types';

interface Props {
  onUpgrade: (tier: SubscriptionTier) => void;
  onCancel: () => void;
}

const Paywall: React.FC<Props> = ({ onUpgrade, onCancel }) => {

  const tiers = [
    {
      name: 'Cadet',
      price: 'Free',
      description: 'A preview to get you started.',
      features: [
        'Access all exam categories',
        '5 questions per exam',
        'Max 10 questions per quiz'
      ],
      isCurrent: true,
    },
    {
      name: 'Professional',
      price: '$350 / 4 months',
      description: 'Master your next certification.',
      features: [
        'Unlock full access to 1 exam track',
        'Unlimited Quizzes & Questions (up to 120)',
        'Timed & Full Simulation Modes',
        'Performance Dashboard & History',
        'All AI-Powered Study Tools'
      ],
      cta: 'Upgrade to Professional',
      tier: 'Professional' as SubscriptionTier
    },
    {
      name: 'Specialist',
      price: '$650 / 4 months',
      description: 'For the multi-disciplinary inspector.',
      features: [
        'Unlock full access to 2 exam tracks',
        'All features from Professional',
        'Perfect for broader expertise',
      ],
      cta: 'Upgrade to Specialist',
      tier: 'Specialist' as SubscriptionTier,
      isPopular: true,
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all animate-fade-in-up">
        <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">Choose Your Plan</h2>
        <p className="text-gray-600 mb-8 text-center">
          Unlock your full potential and gain access to our powerful study tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.name} className={`rounded-lg p-6 border ${tier.isPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p className="text-sm text-gray-500 h-10">{tier.description}</p>
              <p className="text-3xl font-bold my-4">{tier.price}</p>
              <ul className="text-sm space-y-2 text-gray-600 mb-6">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {tier.cta && (
                <button
                  onClick={() => onUpgrade(tier.tier)}
                  className={`w-full p-3 rounded-lg font-bold text-lg transition-colors ${tier.isPopular ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
            <button
                className="text-sm text-gray-500 hover:underline"
                onClick={onCancel}
            >
                Continue with Free Plan
            </button>
        </div>
      </div>
    </div>
  );
};

export default Paywall;