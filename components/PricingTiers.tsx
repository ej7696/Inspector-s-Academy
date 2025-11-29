import React, { useState, useEffect } from 'react';
import { SubscriptionTier, User, SubscriptionTierDetails } from '../types';
import api from '../services/apiService';

interface Props {
  user: Partial<User>; // Can be a partial user for public view
  onUpgrade: (tier: SubscriptionTier) => void;
}

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

const PricingTiers: React.FC<Props> = ({ user, onUpgrade }) => {
  const [tiers, setTiers] = useState<SubscriptionTierDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tierData = api.getSubscriptionTiers();
    setTiers(tierData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800">Loading Plans...</h2>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {tiers.map((tier) => {
        const isCurrent = user.subscriptionTier === tier.tier;
        return (
          <div 
            key={tier.name} 
            className={`rounded-xl p-6 border transition-all duration-300
              ${tier.isPopular ? 'border-blue-500 shadow-2xl scale-105 bg-white' : 'border-gray-200'} 
              ${isCurrent && !tier.isPopular ? 'bg-gray-50' : ''}
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
            {tier.cta && !isCurrent && (
              <button
                type="button"
                onClick={() => onUpgrade(tier.tier)}
                className={`w-full p-3 rounded-lg font-bold text-lg transition-colors ${tier.isPopular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                {tier.cta}
              </button>
            )}
             {isCurrent && tier.name !== 'Starter' && (
               <div className="text-center p-3 rounded-lg font-bold text-lg bg-gray-200 text-gray-500 cursor-default">
                  Current Plan
               </div>
             )}
          </div>
        );
      })}
    </div>
  );
};

export default PricingTiers;