import React, { useState, useEffect } from 'react';
import { User, QuizResult, UserRole } from '../types';
import * as userData from '../services/userData';

interface Props {
  currentUser: User;
  onGoHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ currentUser, onGoHome }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allHistory, setAllHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    // Both are synchronous, so loading them together is fine.
    const allUsers = userData.getAllUsers();
    setUsers(allUsers);
    setAllHistory(userData.getAllHistory().sort((a, b) => b.date - a.date));
  }, []);

  const handleTogglePro = (userToUpdate: User) => {
    const canManage = currentUser.role === 'ADMIN' || (currentUser.role === 'SUB_ADMIN' && userToUpdate.role === 'USER');

    if (!canManage) {
        alert("You don't have permission to perform this action.");
        return;
    }
    if (userToUpdate.id === currentUser.id) {
        alert("You cannot change your own Pro status.");
        return;
    }

    try {
        const updatedUser = { ...userToUpdate, isPro: !userToUpdate.isPro };
        userData.updateUser(updatedUser);
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (error) {
        console.error("Failed to update user:", error);
        alert("Failed to update user status.");
    }
  };

  const handleRoleChange = (userToUpdate: User, newRole: UserRole) => {
    if (currentUser.role !== 'ADMIN') {
        alert("You don't have permission to change user roles.");
        return;
    }
    if (userToUpdate.id === currentUser.id) {
        alert("You cannot change your own role.");
        return;
    }

    // Prevent demoting the last admin
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    if (userToUpdate.role === 'ADMIN' && adminCount <= 1) {
        alert("Cannot demote the last administrator.");
        return;
    }

    try {
        const updatedUser = { ...userToUpdate, role: newRole };
        userData.updateUser(updatedUser);
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (error) {
        console.error("Failed to update user role:", error);
        alert("Failed to update user role.");
    }
  };


  const getUserEmail = (userId: number): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Unknown User';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={onGoHome} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors self-start sm:self-center">
          &larr; Back to Home
        </button>
      </div>

      {/* User Management */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Pro Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
                {currentUser.role === 'ADMIN' && <th scope="col" className="px-6 py-3">Change Role</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const canManageUser = currentUser.role === 'ADMIN' || (currentUser.role === 'SUB_ADMIN' && user.role === 'USER');
                return (
                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.id}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isPro ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.isPro ? 'PRO' : 'FREE'}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            {canManageUser && user.id !== currentUser.id && (
                            <button 
                                onClick={() => handleTogglePro(user)}
                                className="font-medium text-blue-600 hover:underline"
                            >
                                Toggle Pro
                            </button>
                            )}
                        </td>
                        {currentUser.role === 'ADMIN' && (
                             <td className="px-6 py-4">
                                {user.id !== currentUser.id ? (
                                    <select 
                                        value={user.role} 
                                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                    >
                                        <option value="USER">User</option>
                                        <option value="SUB_ADMIN">Sub-Admin</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                ) : (
                                    <span className="text-gray-500 italic">N/A</span>
                                )}
                             </td>
                        )}
                    </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Quiz History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Global Quiz History</h2>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Exam Name</th>
                <th scope="col" className="px-6 py-3">Score</th>
                <th scope="col" className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {allHistory.map(result => (
                <tr key={result.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{getUserEmail(result.userId)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{result.examName}</td>
                  <td className="px-6 py-4">{result.percentage}% ({result.score}/{result.totalQuestions})</td>
                  <td className="px-6 py-4">{new Date(result.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;