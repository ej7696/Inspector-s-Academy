import React, { useState } from 'react';
import { User } from '../types';
import api from '../services/apiService';
import Logo from './Logo';

interface Props {
  user: User;
  onPasswordChanged: () => void;
}

const ForceChangePassword: React.FC<Props> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      api.updateUser(user.id, {
        password: newPassword,
        mustChangePassword: false,
      });
      onPasswordChanged();
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
            <Logo className="h-24 w-auto mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mt-4">Set Your New Password</h1>
            <p className="text-gray-500 mt-2">For your security, you must set a new password before proceeding.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;