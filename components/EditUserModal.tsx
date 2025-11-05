import React, { useState, useEffect } from 'react';
import { User, Exam, SubscriptionTier, Role } from '../types';
import api from '../services/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onImpersonate: (user: User) => void;
}

const EditUserModal: React.FC<Props> = ({ isOpen, onClose, user, currentUser, onUpdateUser, onImpersonate }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(user);
      api.getExams().then(setAllExams);
      setError('');
      setActionMessage('');
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData(prev => ({ 
          ...prev, 
          permissions: { 
              ...(prev.permissions || {
                  canViewUserList: true, canEditUsers: false, canSendPasswordResets: false, canManageAnnouncements: false,
                  canManageExams: false, canAccessPerformanceAnalytics: false, canViewBillingSummary: false,
                  canManageSubscriptions: false, canViewActivityLogs: false, canSuspendUsers: false,
              }),
              [name]: checked 
            }
      }));
  };

  const handleExamToggle = (examName: string) => {
    const unlockedExams = formData.unlockedExams || [];
    const newUnlockedExams = unlockedExams.includes(examName)
      ? unlockedExams.filter(e => e !== examName)
      : [...unlockedExams, examName];
    setFormData(prev => ({ ...prev, unlockedExams: newUnlockedExams }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setActionMessage('');
    try {
      const updatedUser = await api.updateUser(user.id, formData);
      onUpdateUser(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
      if(window.confirm(`Are you sure you want to send a password reset to ${user.email}?`)) {
          try {
            await api.sendPasswordReset(user.email);
            setActionMessage('Password reset email sent successfully.');
          } catch(err: any) {
            setError(err.message || 'Failed to send reset email.');
          }
      }
  };

  const handleToggleSuspend = async () => {
      const action = user.isSuspended ? 'unsuspend' : 'suspend';
      if(window.confirm(`Are you sure you want to ${action} this user?`)) {
          try {
            const updatedUser = await api.updateUser(user.id, { isSuspended: !user.isSuspended });
            onUpdateUser(updatedUser);
            setActionMessage(`User has been ${action}ed.`);
            onClose(); // Close modal after action
          } catch (err: any) {
            setError(err.message || `Failed to ${action} user.`);
          }
      }
  };

  const canEditRole = currentUser.role === 'ADMIN' && currentUser.id !== user.id && user.role !== 'ADMIN';
  const canPerformActionsOnUser = currentUser.id !== user.id && (currentUser.role === 'ADMIN' || (currentUser.role === 'SUB_ADMIN' && user.role === 'USER'));


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Manage User: {user.email}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md"/>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md"/>
              </div>
          </div>
          
           {/* Subscription & Role */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subscription Tier</label>
                    <select name="subscriptionTier" value={formData.subscriptionTier || 'STARTER'} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                        <option value="STARTER">Starter</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="SPECIALIST">Specialist</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role || 'USER'} onChange={handleChange} disabled={!canEditRole} className="w-full mt-1 p-2 border border-gray-300 rounded-md disabled:bg-gray-100">
                        <option value="USER">USER</option>
                        <option value="SUB_ADMIN">SUB_ADMIN</option>
                        {currentUser.role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                    </select>
                </div>
            </div>
          
            {/* Sub-Admin Permissions */}
            {formData.role === 'SUB_ADMIN' && currentUser.role === 'ADMIN' && (
                <div>
                    <label className="block text-sm font-bold text-gray-700">Sub-Admin Permissions</label>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-50 rounded-md border">
                        <label className="flex items-center"><input type="checkbox" name="canViewUserList" checked={formData.permissions?.canViewUserList || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View user list</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canEditUsers" checked={formData.permissions?.canEditUsers || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Edit user profiles</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canSendPasswordResets" checked={formData.permissions?.canSendPasswordResets || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Send password resets</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canManageSubscriptions" checked={formData.permissions?.canManageSubscriptions || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage subscriptions</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canSuspendUsers" checked={formData.permissions?.canSuspendUsers || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Suspend / unsuspend users</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canManageAnnouncements" checked={formData.permissions?.canManageAnnouncements || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage announcements</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canManageExams" checked={formData.permissions?.canManageExams || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage exams & questions</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canAccessPerformanceAnalytics" checked={formData.permissions?.canAccessPerformanceAnalytics || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Access performance analytics</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canViewBillingSummary" checked={formData.permissions?.canViewBillingSummary || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View billing summary</span></label>
                        <label className="flex items-center"><input type="checkbox" name="canViewActivityLogs" checked={formData.permissions?.canViewActivityLogs || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View activity logs</span></label>
                    </div>
                </div>
            )}

            {/* Manual Exam Unlocks */}
            {formData.subscriptionTier !== 'STARTER' && (
                <div>
                    <label className="block text-sm font-bold text-gray-700">Manual Exam Unlocks</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allExams.map(exam => (
                            <label key={exam.id} className="flex items-center p-2 bg-gray-50 border rounded-md">
                                <input
                                    type="checkbox"
                                    checked={(formData.unlockedExams || []).includes(exam.name)}
                                    onChange={() => handleExamToggle(exam.name)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{exam.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Quick Actions */}
            {canPerformActionsOnUser && (
                <div>
                    <label className="block text-sm font-bold text-gray-700">Quick Actions</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                         {(currentUser.role === 'ADMIN' || currentUser.permissions?.canSendPasswordResets) && (
                            <button type="button" onClick={handlePasswordReset} className="text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1 rounded-md">Send Password Reset</button>
                         )}
                         {(currentUser.role === 'ADMIN' || currentUser.permissions?.canSuspendUsers) && (
                             <button type="button" onClick={handleToggleSuspend} className={`text-sm text-white px-3 py-1 rounded-md ${user.isSuspended ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                                {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                            </button>
                         )}
                    </div>
                </div>
            )}
            
            {actionMessage && <p className="text-green-600 text-sm mt-2">{actionMessage}</p>}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          
            <div className="flex justify-between items-center pt-4 border-t mt-auto">
                <div>
                    {currentUser.role === 'ADMIN' && currentUser.id !== user.id && (
                        <button type="button" onClick={() => onImpersonate(user)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 text-sm">
                            Impersonate User
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                    <button type="submit" disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:bg-gray-400">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
