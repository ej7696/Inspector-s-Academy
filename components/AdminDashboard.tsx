import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, SubscriptionTier, UserRole } from '../types';
import { fetchAllUsers, updateUser } from '../services/userData';

interface Props {
  currentUser: User;
  onGoHome: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex-1">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {children}
    </div>
);

const UserGrowthChart: React.FC<{ users: User[] }> = ({ users }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && users.length > 0 && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const data = Array(30).fill(0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                users.forEach(user => {
                    const daysAgo = Math.floor((today.getTime() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24));
                    if (daysAgo >= 0 && daysAgo < 30) {
                        data[29 - daysAgo]++;
                    }
                });
                
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({ length: 30 }, (_, i) => new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
                        datasets: [{
                            label: 'New Users',
                            data: data.map((sum => value => sum += value)(0)), // Cumulative
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            tension: 0.2
                        }]
                    },
                    options: {
                        scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Users' } } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [users]);

    return <canvas ref={chartRef}></canvas>;
};


const AdminDashboard: React.FC<Props> = ({ currentUser, onGoHome }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('All Users');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // A sub-admin should not see this page in a real-world scenario,
    // but for this demo we will allow it, though they cannot edit Admins.
    if (currentUser.role === 'USER') {
      onGoHome();
    } else {
      setAllUsers(fetchAllUsers());
    }
  }, [currentUser, onGoHome]);

  const filteredUsers = useMemo(() => {
    return allUsers
        .filter(user => {
            if (filter === 'All Users') return true;
            if (filter === 'Admins') return user.role === 'ADMIN';
            if (filter === 'Sub-Admins') return user.role === 'SUB_ADMIN';
            if (filter === 'Professionals') return user.subscriptionTier === 'Professional';
            if (filter === 'Specialists') return user.subscriptionTier === 'Specialist';
            if (filter === 'Cadets') return user.subscriptionTier === 'Cadet';
            return true;
        })
        .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allUsers, filter, searchTerm]);

  const activeUsers = useMemo(() => allUsers.filter(u => Date.now() - u.lastActive < 7 * 24 * 60 * 60 * 1000).length, [allUsers]);
  const subscriptionCounts = useMemo(() => allUsers.reduce((acc, u) => {
      acc[u.subscriptionTier] = (acc[u.subscriptionTier] || 0) + 1;
      return acc;
  }, {} as Record<SubscriptionTier, number>), [allUsers]);
  
  const quizzesToday = useMemo(() => allUsers.reduce((sum, u) => 
    sum + u.history.filter(h => Date.now() - h.date < 24 * 60 * 60 * 1000).length, 0), [allUsers]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setAllUsers(prev => prev.map(u => {
        if (u.id === userId) {
            const updated = {...u, role: newRole};
            updateUser(updated);
            return updated;
        }
        return u;
    }));
  };
  
  const handleTierChange = (userId: string, newTier: SubscriptionTier) => {
    setAllUsers(prev => prev.map(u => {
        if (u.id === userId) {
            const updated = {...u, subscriptionTier: newTier};
            if(newTier === 'Cadet') updated.subscriptionExpiresAt = undefined;
            else if(!updated.subscriptionExpiresAt || updated.subscriptionExpiresAt < Date.now()) {
                updated.subscriptionExpiresAt = Date.now() + 120 * 24 * 60 * 60 * 1000;
            }
            updateUser(updated);
            return updated;
        }
        return u;
    }));
  };

  const handleResetPassword = (userId: string) => {
    const userToReset = allUsers.find(u => u.id === userId);
    if (!userToReset) return;

    if (window.confirm(`Are you sure you want to reset the password for ${userToReset.email}?`)) {
        const newPassword = 'password123'; // Default reset password
        
        setAllUsers(prev => prev.map(u => {
            if (u.id === userId) {
                const updated = { ...u, password: newPassword };
                updateUser(updated); // Persist change
                return updated;
            }
            return u;
        }));

        alert(`Password for ${userToReset.email} has been reset to "${newPassword}".`);
    }
  };


  if (currentUser.role === 'USER') return null;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={onGoHome} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors self-start sm:self-center">
          &larr; Back to Home
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Active Users (7d)" value={activeUsers} />
          <StatCard title="Subscription Breakdown" value={`${subscriptionCounts.Professional || 0} Pro / ${subscriptionCounts.Specialist || 0} Spc`}>
             <div className="text-xs text-gray-500">{subscriptionCounts.Cadet || 0} Cadets</div>
          </StatCard>
          <StatCard title="Quizzes Taken (24h)" value={quizzesToday} />
          <StatCard title="Total Users" value={allUsers.length} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">User Growth (Last 30 Days)</h3>
            <UserGrowthChart users={allUsers} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Another Chart Placeholder</h3>
            <div className="flex items-center justify-center h-full text-gray-400">Coming Soon</div>
        </div>
      </div>


      {/* User Management Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input 
                  type="text" 
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-grow p-2 border rounded-md"
              />
              <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2 border rounded-md bg-white">
                  {['All Users', 'Admins', 'Sub-Admins', 'Professionals', 'Specialists', 'Cadets'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map(user => {
                          const canEdit = currentUser.role === 'ADMIN' && currentUser.id !== user.id;
                          const canEditSubAdmin = currentUser.role === 'ADMIN' && user.role !== 'ADMIN';
                          return (
                          <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.role}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      user.subscriptionTier === 'Specialist' ? 'bg-green-100 text-green-800' :
                                      user.subscriptionTier === 'Professional' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                  }`}>
                                      {user.subscriptionTier}
                                  </span>
                                  {user.subscriptionExpiresAt && <div className="text-xs text-gray-500 mt-1">Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">Last Active: {new Date(user.lastActive).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">{user.history.length} quizzes taken</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 <div className="flex gap-2 items-center">
                                     <select 
                                        value={user.subscriptionTier} 
                                        onChange={e => handleTierChange(user.id, e.target.value as SubscriptionTier)} 
                                        className="text-xs p-1 border rounded bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!canEdit}
                                    >
                                         <option value="Cadet">Cadet</option>
                                         <option value="Professional">Professional</option>
                                         <option value="Specialist">Specialist</option>
                                     </select>
                                     <select 
                                        value={user.role} 
                                        onChange={e => handleRoleChange(user.id, e.target.value as UserRole)} 
                                        className="text-xs p-1 border rounded bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!canEditSubAdmin}
                                    >
                                         <option value="USER">User</option>
                                         <option value="SUB_ADMIN">Sub-Admin</option>
                                         <option value="ADMIN">Admin</option>
                                     </select>
                                     <button 
                                        onClick={() => handleResetPassword(user.id)}
                                        className="text-xs p-1 border rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        disabled={!canEdit}
                                    >
                                        Reset Pass
                                    </button>
                                 </div>
                              </td>
                          </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;