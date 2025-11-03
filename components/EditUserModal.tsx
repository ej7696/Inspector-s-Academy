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

  useEffect(() => {
    if (isOpen) {
      setFormData(user);
      api.getExams().then(setAllExams);
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
          permissions: { ...prev.permissions, [name]: checked }
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
                    <select name="subscriptionTier" value={formData.subscriptionTier || 'Cadet'} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                        <option value="Cadet">Cadet</option>
                        <option value="Professional">Professional</option>
                        <option value="Specialist">Specialist</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role || 'USER'} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                        <option value="USER">USER</option>
                        <option value="SUB_ADMIN">SUB_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
                </div>
            </div>
          
            {/* Sub-Admin Permissions */}
            {formData.role === 'SUB_ADMIN' && (
                <div>
                    <label className="block text-sm font-bold text-gray-700">Sub-Admin Permissions</label>
                    <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-md border">
                        <label className="flex items-center">
                            <input type="checkbox" name="canEditUsers" checked={formData.permissions?.canEditUsers || false} onChange={handlePermissionChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                            <span className="ml-2 text-sm text-gray-700">Can edit user profiles</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" name="canResetPasswords" checked={formData.permissions?.canResetPasswords || false} onChange={handlePermissionChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                            <span className="ml-2 text-sm text-gray-700">Can reset user passwords</span>
                        </label>
                    </div>
                </div>
            )}
            
            {/* Manual Exam Unlocks */}
            <div>
                <label className="block text-sm font-bold text-gray-700">Manually Unlocked Exams</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-md border max-h-40 overflow-y-auto">
                    {allExams.map(exam => (
                         <label key={exam.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                            <input type="checkbox" checked={(formData.unlockedExams || []).includes(exam.name)} onChange={() => handleExamToggle(exam.name)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                            <span className="ml-2 text-sm text-gray-700">{exam.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t">
                 {currentUser.role === 'ADMIN' && currentUser.id !== user.id && (
                     <button type="button" onClick={() => onImpersonate(user)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-600">
                        Impersonate User
                    </button>
                 )}
                <div className="flex-grow"></div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                    <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:bg-gray-400">
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
