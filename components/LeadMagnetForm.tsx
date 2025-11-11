
import React, { useState } from 'react';
import api from '../services/apiService';

const LeadMagnetForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      api.captureLead(email);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-xl font-bold text-green-800">Thank You!</h3>
        <p className="text-green-700 mt-2">Your API 510 Cheat Sheet is on its way. Check your inbox!</p>
        <a 
            href="/public/api-510-cheat-sheet.pdf" 
            download
            className="mt-4 inline-block bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
            Download Now
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <h3 className="text-xl font-bold text-blue-800">Get Your Free API 510 Cheat Sheet</h3>
      <p className="text-blue-700 mt-2 mb-4">Enter your email to download our exclusive one-page reference guide with key formulas and tables.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-grow p-2 border border-gray-300 rounded-md"
          required
        />
        <button type="submit" className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Get Cheat Sheet
        </button>
      </form>
    </div>
  );
};

export default LeadMagnetForm;
