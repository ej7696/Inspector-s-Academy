import React, { useState, useMemo } from 'react';
import { User, SubscriptionTier } from '../types';

interface Props {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onGoHome: () => void;
  onViewDashboard: () => void;
  onManageSubscription: () => void;
}

const UserProfile: React.FC<Props> = ({ user, onUpdateUser, onGoHome, onViewDashboard, onManageSubscription }) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState({ current: '', new: '', confirm: ''});
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleEmailSave = () => {
    onUpdateUser({ email });
    setIsEditingEmail(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError('');
      setPasswordSuccess('');

      if (password.new !== password.confirm) {
          setPasswordError("New passwords do not match.");
          return;
      }
      if (password.new.length < 6) {
          setPasswordError("New password must be at least 6 characters long.");
          return;
      }
      if (user.password !== password.current) {
          setPasswordError("Current password is incorrect.");
          return;
      }
      
      onUpdateUser({ password: password.new });
      setPassword({ current: '', new: '', confirm: '' });
      setPasswordSuccess("Password updated successfully!");
  }

  const averageScore = useMemo(() => {
    if (user.history.length === 0) return 0;
    const total = user.history.reduce((acc, result) => acc + result.percentage, 0);
    return total / user.history.length;
  }, [user.history]);
  
  const uniqueExamsPracticed = useMemo(() => {
      const examNames = user.history.map(h => h.examName);
      return [...new Set(examNames)];
  }, [user.history]);
  
  const getTierDisplayName = (tier: SubscriptionTier) => {
      switch(tier) {
          case 'STARTER': return 'Starter';
          case 'PROFESSIONAL': return 'Professional';
          case 'SPECIALIST': return 'Specialist';
          default: return tier;
      }
  };

  const getTierColor = (tier: SubscriptionTier) => {
      switch (tier) {
          case 'SPECIALIST': return 'bg-green-100 text-green-800';
          case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800';
          case 'STARTER':
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <button onClick={onGoHome} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors self-start sm:self-center">
          &larr; Back to Home
        </button>
      </div>

      {/* Personal Details */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Personal Details</h2>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    {isEditingEmail ? (
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="text-lg text-gray-800 p-1 border rounded-md"/>
                    ) : (
                        <p className="text-lg text-gray-800">{user.email}</p>
                    )}
                </div>
                {isEditingEmail ? (
                    <div className="flex gap-2">
                        <button onClick={handleEmailSave} className="text-sm text-green-600 font-semibold hover:underline">Save</button>
                        <button onClick={() => { setIsEditingEmail(false); setEmail(user.email); }} className="text-sm text-gray-500 hover:underline">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditingEmail(true)} className="text-sm text-blue-600 font-semibold hover:underline">Edit</button>
                )}
            </div>
            
             {/* Change Password */}
            <div>
                <h3 className="text-md font-semibold text-gray-700 mb-2">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3 p-4 bg-gray-50 rounded-md border">
                    <input type="password" placeholder="Current Password" value={password.current} onChange={e => setPassword({...password, current: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    <input type="password" placeholder="New Password" value={password.new} onChange={e => setPassword({...password, new: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    <input type="password" placeholder="Confirm New Password" value={password.confirm} onChange={e => setPassword({...password, confirm: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                    {passwordSuccess && <p className="text-sm text-green-500">{passwordSuccess}</p>}
                    <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-700">Update Password</button>
                </form>
            </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Subscription Details</h2>
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <label className="text-sm font-medium text-gray-500">Current Plan</label>
                  <p className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getTierColor(user.subscriptionTier)}`}>{getTierDisplayName(user.subscriptionTier)}</p>
                  {user.subscriptionExpiresAt && (
                      <p className="text-sm text-gray-500 mt-2">Your plan is valid until {new Date(user.subscriptionExpiresAt).toLocaleDateString()}.</p>
                  )}
              </div>
              <button onClick={onManageSubscription} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                  Manage Subscription
              </button>
          </div>
      </div>
      
      {/* Referral Program */}
       <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Referral Program</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
                <p className="font-semibold text-blue-800">Share your referral code:</p>
                <p className="text-2xl font-bold text-blue-600 tracking-wider bg-white px-3 py-1 rounded-md inline-block my-2">{user.referralCode}</p>
                <p className="text-sm text-blue-700">Give a colleague 10% off their first purchase, and you'll get a $25 credit!</p>
            </div>
            <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Your Credit</p>
                <p className="text-3xl font-bold text-green-600">${user.accountCredit?.toFixed(2) || '0.00'}</p>
            </div>
        </div>
       </div>


      {/* Practice History Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Practice Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
            <div>
                <p className="text-3xl font-bold text-blue-600">{user.history.length}</p>
                <p className="text-sm text-gray-500">Quizzes Taken</p>
            </div>
            <div>
                <p className="text-3xl font-bold text-green-600">{averageScore.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Average Score</p>
            </div>
             <div>
                <p className="text-3xl font-bold text-indigo-600">{uniqueExamsPracticed.length}</p>
                <p className="text-sm text-gray-500">Exams Practiced</p>
            </div>
        </div>
        <h3 className="text-md font-semibold text-gray-700 mb-2">Recent Activity</h3>
        {user.history.length > 0 ? (
            <ul className="divide-y divide-gray-200">
                {user.history.slice(-3).reverse().map(result => (
                    <li key={result.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-800">{result.examName}</p>
                            <p className="text-sm text-gray-500">{new Date(result.date).toLocaleString()}</p>
                        </div>
                        <p className={`font-bold text-lg ${result.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>{result.percentage.toFixed(1)}%</p>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-gray-500 py-4">No quizzes completed yet.</p>
        )}
        <button onClick={onViewDashboard} className="w-full mt-6 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
            View Full Performance Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
