import React, { useState, useEffect } from 'react';
import api from '../services/apiService';

interface Props {
  onClose: () => void;
}

const TestimonialCollector: React.FC<Props> = ({ onClose }) => {
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const user = api.getCurrentUser();

  useEffect(() => {
      if (user) {
          setAuthor(user.fullName || '');
      }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quote.trim() && author.trim()) {
      api.addTestimonial(author, quote);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        {isSubmitted ? (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
                <p className="text-gray-700 mb-6">Your feedback is invaluable and helps others make confident decisions. We appreciate you!</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Close
                </button>
            </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Great Job!</h2>
            <p className="text-gray-600 mb-6">You're doing amazing! Would you be willing to share a few words about your experience to help others on their certification journey?</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="quote" className="block text-sm font-medium text-gray-700">Your Testimonial</label>
                <textarea
                  id="quote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="e.g., 'This platform was a game-changer for my exam prep...'"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md h-24"
                  required
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="John D., API 510"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold">No, thanks</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Submit Testimonial</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TestimonialCollector;
