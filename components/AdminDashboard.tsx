import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getAllUsers, updateUser } from '../services/userData';

interface Props {
    currentUser: User;
    onGoHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ currentUser, onGoHome }) => {
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        setUsers(getAllUsers());
    }, []);

    const handleProToggle = (userToUpdate: User) => {
        const updatedUser = { ...userToUpdate, isPro: !userToUpdate.isPro };
        if (updateUser(updatedUser)) {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
    };

    const handleRoleChange = (userToUpdate: User, newRole: UserRole) => {
         const lastAdmin = users.filter(u => u.role === 'ADMIN').length === 1;
         if (userToUpdate.role === 'ADMIN' && lastAdmin) {
             alert("Cannot demote the last admin.");
             return;
         }
        const updatedUser = { ...userToUpdate, role: newRole };
        if (updateUser(updatedUser)) {
             setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
    };

    const canManage = (targetUser: User): boolean => {
        if (currentUser.role === 'ADMIN') {
            return true; // Admins can manage anyone
        }
        if (currentUser.role === 'SUB_ADMIN') {
            return targetUser.role === 'USER'; // Sub-admins can only manage users
        }
        return false;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <button onClick={onGoHome} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600">
                    &larr; Back to Home
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">User Management</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isPro ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isPro ? 'Pro' : 'Free'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                       {canManage(user) ? (
                                           <>
                                            <button 
                                                onClick={() => handleProToggle(user)}
                                                className={`px-3 py-1 text-xs rounded-md ${user.isPro ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                                            >
                                                {user.isPro ? 'Revoke Pro' : 'Make Pro'}
                                            </button>
                                            {currentUser.role === 'ADMIN' && currentUser.id !== user.id && (
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                                                    className="p-1 text-xs rounded-md border-gray-300"
                                                >
                                                    <option value="USER">User</option>
                                                    <option value="SUB_ADMIN">Sub-Admin</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            )}
                                           </>
                                       ) : (
                                           <span className="text-xs text-gray-400">No permissions</span>
                                       )}
                                    </td>
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
