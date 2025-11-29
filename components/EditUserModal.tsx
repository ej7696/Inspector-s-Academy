import React, { useState, useEffect } from 'react';
import { User, Exam, SubscriptionTier, Role } from '../types';
import api from '../services/apiService';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onImpersonate: (user: User) => void;
}

const EditUserModal: React.FC<Props> = ({ isOpen, onClose, user, currentUser, onUpdateUser, onImpersonate }) => {
  const [localUser, setLocalUser] = useState<User>(user);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // State for Admin-Defined Password
  const [newTempPassword, setNewTempPassword] = useState('');
  const [showSetPasswordConfirm, setShowSetPasswordConfirm] = useState(false);

  // State for Suspension Toggle
  const [suspensionConfirmation, setSuspensionConfirmation] = useState<{ action: 'suspend' | 'unsuspend' } | null>(null);

  useEffect(() => {
    // This effect runs ONLY when the user ID being edited changes,
    // correctly initializing state without wiping feedback on subsequent re-renders.
    setLocalUser(user);
    setAllExams(api.getExams());
    setError('');
    setActionMessage('');
    setNewTempPassword('');
    setShowSetPasswordConfirm(false);
    setSuspensionConfirmation(null);
  }, [user.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalUser(prev => ({ ...prev, [name]: value } as User));
  };
  
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setLocalUser(prev => ({ 
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
    const unlockedExams = localUser.unlockedExams || [];
    const newUnlockedExams = unlockedExams.includes(examName)
      ? unlockedExams.filter(e => e !== examName)
      : [...unlockedExams, examName];
    setLocalUser(prev => ({ ...prev, unlockedExams: newUnlockedExams }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setActionMessage('');
    try {
      const updatedUser = api.updateUser(localUser.id, localUser);
      onUpdateUser(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Admin-Defined Password Handlers ---
  const handleInitiateSetPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (newTempPassword.length < 6) {
        setError("New temporary password must be at least 6 characters.");
        return;
    }
    setShowSetPasswordConfirm(true);
  };

  const handleConfirmSetPassword = () => {
    try {
      api.adminSetPassword(localUser.id, newTempPassword);
      const updatedUserFromApi = api.getAllUsers().find(u => u.id === localUser.id)!;
      setLocalUser(updatedUserFromApi);
      setActionMessage('User password has been set successfully.');
      setNewTempPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to set password.');
    } finally {
      setShowSetPasswordConfirm(false);
    }
  };

  // --- Suspension Toggle Handlers ---
  const handleSuspensionToggle = () => {
    const action = localUser.isSuspended ? 'unsuspend' : 'suspend';
    setSuspensionConfirmation({ action });
  };
  
  const handleConfirmSuspension = () => {
    if (!suspensionConfirmation) return;

    setError('');
    setActionMessage('');
    const action = suspensionConfirmation.action;
    
    try {
      const newSuspendedState = action === 'suspend';
      const updatedUser = api.updateUser(localUser.id, { isSuspended: newSuspendedState });
      setLocalUser(updatedUser);
      setActionMessage(`User has been successfully ${newSuspendedState ? 'suspended' : 'activated'}.`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to ${action} user.`);
    } finally {
      setSuspensionConfirmation(null);
    }
  };

  const canEditRole = currentUser.role === 'ADMIN' && currentUser.id !== localUser.id && localUser.role !== 'ADMIN';
  const canPerformActionsOnUser = currentUser.id !== localUser.id && (currentUser.role === 'ADMIN' || (currentUser.role === 'SUB_ADMIN' && localUser.role === 'USER'));
  const canManageSubs = currentUser.role === 'ADMIN' || !!currentUser.permissions?.canManageSubscriptions;
  const canSuspend = canPerformActionsOnUser && (currentUser.role === 'ADMIN' || !!currentUser.permissions?.canSuspendUsers);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Manage User: {localUser.email}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" name="fullName" value={localUser.fullName || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input type="tel" name="phoneNumber" value={localUser.phoneNumber || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md"/>
                </div>
            </div>
            
             {/* Subscription & Role */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Subscription Tier</label>
                      <select 
                          name="subscriptionTier" 
                          value={localUser.subscriptionTier || 'STARTER'} 
                          onChange={handleChange} 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={!canManageSubs}
                      >
                          <option value="STARTER">Starter</option>
                          <option value="PROFESSIONAL">Professional</option>
                          <option value="SPECIALIST">Specialist</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select name="role" value={localUser.role || 'USER'} onChange={handleChange} disabled={!canEditRole} className="w-full mt-1 p-2 border border-gray-300 rounded-md disabled:bg-gray-100">
                          <option value="USER">User</option>
                          <option value="SUB_ADMIN">Sub-Admin</option>
                          {currentUser.role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                      </select>
                  </div>
              </div>
            
              {/* Sub-Admin Permissions */}
              {localUser.role === 'SUB_ADMIN' && currentUser.role === 'ADMIN' && (
                  <div>
                      <label className="block text-sm font-bold text-gray-700">Sub-Admin Permissions</label>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-50 rounded-md border">
                          <label className="flex items-center"><input type="checkbox" name="canViewUserList" checked={localUser.permissions?.canViewUserList || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View user list</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canEditUsers" checked={localUser.permissions?.canEditUsers || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Edit user profiles</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canSendPasswordResets" checked={localUser.permissions?.canSendPasswordResets || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Send password resets</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canManageSubscriptions" checked={localUser.permissions?.canManageSubscriptions || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage subscriptions</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canSuspendUsers" checked={localUser.permissions?.canSuspendUsers || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Suspend / unsuspend users</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canManageAnnouncements" checked={localUser.permissions?.canManageAnnouncements || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage announcements</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canManageExams" checked={localUser.permissions?.canManageExams || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Manage exams & questions</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canAccessPerformanceAnalytics" checked={localUser.permissions?.canAccessPerformanceAnalytics || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">Access performance analytics</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canViewBillingSummary" checked={localUser.permissions?.canViewBillingSummary || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View billing summary</span></label>
                          <label className="flex items-center"><input type="checkbox" name="canViewActivityLogs" checked={localUser.permissions?.canViewActivityLogs || false} onChange={handlePermissionChange} className="h-4 w-4"/> <span className="ml-2 text-sm">View activity logs</span></label>
                      </div>
                  </div>
              )}

              {/* Manual Exam Unlocks */}
              {localUser.subscriptionTier !== 'STARTER' && (
                  <fieldset disabled={!canManageSubs}>
                      <label className={`block text-sm font-bold ${!canManageSubs ? 'text-gray-400' : 'text-gray-700'}`}>Manual Exam Unlocks</label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {allExams.map(exam => (
                              <label key={exam.id} className={`flex items-center p-2 bg-gray-50 border rounded-md ${!canManageSubs ? 'cursor-not-allowed' : ''}`}>
                                  <input
                                      type="checkbox"
                                      checked={(localUser.unlockedExams || []).includes(exam.name)}
                                      onChange={() => handleExamToggle(exam.name)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded disabled:cursor-not-allowed"
                                      disabled={!canManageSubs}
                                  />
                                  <span className={`ml-2 text-sm ${!canManageSubs ? 'text-gray-400' : 'text-gray-700'}`}>{exam.name}</span>
                              </label>
                          ))}
                      </div>
                      {!canManageSubs && <p className="text-xs text-gray-500 mt-1">You do not have permission to manage subscriptions.</p>}
                  </fieldset>
              )}

              {/* Account Status */}
              {canPerformActionsOnUser && (
                <div>
                  <label className="block text-sm font-bold text-gray-700">Account Status</label>
                  <div className="mt-2 flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox"
                            checked={!localUser.isSuspended}
                            onChange={handleSuspensionToggle}
                            disabled={!canSuspend}
                            id={`suspend-toggle-${localUser.id}`}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor={`suspend-toggle-${localUser.id}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    {localUser.isSuspended ? (
                        <span className="font-semibold text-red-600">Suspended</span>
                    ) : (
                        <span className="font-semibold text-green-600">Active</span>
                    )}
                  </div>
                  {!canSuspend && <p className="text-xs text-gray-500 mt-1">You do not have permission to suspend users.</p>}
                </div>
              )}
              
              {/* Credential Management */}
              {canPerformActionsOnUser && (
                  <div>
                      <label className="block text-sm font-bold text-gray-700">Credential Management</label>
                       <div className="mt-2 flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                           <input 
                              type="password"
                              value={newTempPassword}
                              onChange={(e) => setNewTempPassword(e.target.value)}
                              placeholder="Enter a temporary password..."
                              className="flex-grow p-2 border rounded-md"
                              disabled={!(currentUser.role === 'ADMIN' || currentUser.permissions?.canSendPasswordResets)}
                           />
                           <button 
                              type="button" 
                              onClick={handleInitiateSetPassword} 
                              disabled={!newTempPassword || !(currentUser.role === 'ADMIN' || currentUser.permissions?.canSendPasswordResets)}
                              className='text-sm px-3 py-2 rounded-md transition-colors bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed'
                          >
                              Set Password
                          </button>
                      </div>
                  </div>
              )}
              
              {actionMessage && <p className="text-green-600 text-sm mt-2">{actionMessage}</p>}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
              <div className="flex justify-between items-center pt-4 border-t mt-auto">
                  <div>
                      {currentUser.role === 'ADMIN' && currentUser.id !== localUser.id && (
                          <button type="button" onClick={() => onImpersonate(localUser)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 text-sm">
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
       {suspensionConfirmation && (
        <ConfirmDialog 
          open={true}
          title={`${suspensionConfirmation.action.charAt(0).toUpperCase() + suspensionConfirmation.action.slice(1)} User?`}
          message={`Are you sure you want to ${suspensionConfirmation.action} this user's account?`}
          onConfirm={handleConfirmSuspension}
          onCancel={() => setSuspensionConfirmation(null)}
        />
      )}
      {showSetPasswordConfirm && (
        <ConfirmDialog 
          open={true}
          title="Set New Password?"
          message={`Are you sure you want to set this user's password to "${newTempPassword}"? Their old password will no longer work.`}
          onConfirm={handleConfirmSetPassword}
          onCancel={() => setShowSetPasswordConfirm(false)}
        />
      )}
      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #16A34A; /* green-600 */ }
        .toggle-checkbox:checked + .toggle-label { background-color: #16A34A; /* green-600 */ }
        .toggle-checkbox:not(:checked) { border-color: #EF4444; /* red-500 */ }
        .toggle-checkbox:not(:checked) + .toggle-label { background-color: #EF4444; /* red-500 */ }
      `}</style>
    </>
  );
};

export default EditUserModal;
