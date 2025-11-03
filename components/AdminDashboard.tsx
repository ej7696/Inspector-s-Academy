import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, SubscriptionTier, UserRole, ActivityEvent } from '../types';
import api from '../services/apiService';
import ConfirmDialog from './ConfirmDialog';

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
                    options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Users' } } }, plugins: { legend: { display: false } } }
                });
            }
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [users]);
    return <canvas ref={chartRef}></canvas>;
};


const AdminDashboard: React.FC<{ currentUser: User, onGoHome: () => void }> = ({ currentUser, onGoHome }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All Users');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingReset, setPendingReset] = useState<User | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
        if (currentUser.role === 'USER') {
            onGoHome();
            return;
        }
        try {
            // No need to set loading to true here to allow for smooth background refresh
            const users = await api.fetchAllUsers();
            const feed = await api.fetchActivityFeed();
            setAllUsers(users);
            setActivityFeed(feed);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
    const intervalId = setInterval(loadData, 5000); // Poll for new data every 5 seconds
    return () => clearInterval(intervalId);
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
  const subscriptionCounts = useMemo(() => allUsers.reduce((acc, u) => { acc[u.subscriptionTier] = (acc[u.subscriptionTier] || 0) + 1; return acc; }, {} as Record<SubscriptionTier, number>), [allUsers]);
  const quizzesToday = useMemo(() => allUsers.reduce((sum, u) => sum + u.history.filter(h => Date.now() - h.date < 24 * 60 * 60 * 1000).length, 0), [allUsers]);

  const handleUserUpdate = async (updatedUser: User) => {
      try {
          const savedUser = await api.updateUser(updatedUser);
          setAllUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
      } catch (error) {
          console.error("Failed to update user:", error);
          alert(`Error: Could not update user ${updatedUser.email}.`);
      }
  };
  
  const confirmPasswordReset = () => {
      if (!pendingReset) return;
      const newPassword = 'password123';
      handleUserUpdate({ ...pendingReset, password: newPassword });
      alert(`Password for ${pendingReset.email} has been reset to '${newPassword}'.`);
      setPendingReset(null);
  };
  
  const canEdit = (targetUser: User) => {
      if (currentUser.role === 'ADMIN') return true;
      if (currentUser.role === 'SUB_ADMIN' && targetUser.role === 'USER') return true;
      return false;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    const icons: Record<ActivityEvent['type'], string> = {
        login: '👤',
        upgrade: '⭐',
        quiz_completion: '✅',
        exam_unlock: '🔑'
    };
    return icons[type] || '🔔';
  };

  if (isLoading) {
    return <div className="text-center p-10"><p className="text-xl">Loading Admin Dashboard...</p></div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={onGoHome} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors self-start sm:self-center">
          &larr; Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Active Users (7 days)" value={activeUsers} />
          <StatCard title="Total Users" value={allUsers.length} />
          <StatCard title="Quizzes Taken (24h)" value={quizzesToday} />
          <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <h3 className="text-sm font-medium text-gray-500">Subscription Tiers</h3>
              <div className="flex justify-around items-center h-full">
                  <span title="Specialist" className="font-bold text-lg text-green-600">{subscriptionCounts['Specialist'] || 0}</span>
                  <span title="Professional" className="font-bold text-lg text-blue-600">{subscriptionCounts['Professional'] || 0}</span>
                  <span title="Cadet" className="font-bold text-lg text-gray-600">{subscriptionCounts['Cadet'] || 0}</span>
              </div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-700 mb-4">User Growth (Last 30 Days)</h2>
              <UserGrowthChart users={allUsers} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Real-Time Activity Feed</h2>
              <ul className="space-y-3 h-96 overflow-y-auto pr-2">
                  {activityFeed.map(event => (
                      <li key={event.id} className="flex items-start">
                          <span className="text-xl mr-3 mt-1">{getActivityIcon(event.type)}</span>
                          <div>
                              <p className="text-sm text-gray-800">
                                  <span className="font-semibold">{event.userEmail}</span> {event.message}
                              </p>
                              <p className="text-xs text-gray-400">{formatTimeAgo(event.timestamp)}</p>
                          </div>
                      </li>
                  ))}
              </ul>
          </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input type="text" placeholder="Search by email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border rounded-md"/>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2 border rounded-md bg-white">
                <option>All Users</option><option>Admins</option><option>Sub-Admins</option>
                <option>Specialists</option><option>Professionals</option><option>Cadets</option>
            </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{user.email}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select value={user.subscriptionTier} onChange={e => handleUserUpdate({...user, subscriptionTier: e.target.value as SubscriptionTier})} disabled={!canEdit(user)} className="p-1 border rounded-md text-sm bg-white disabled:bg-gray-100 disabled:border-transparent">
                        <option>Cadet</option><option>Professional</option><option>Specialist</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select value={user.role} onChange={e => handleUserUpdate({...user, role: e.target.value as UserRole})} disabled={currentUser.role !== 'ADMIN'} className="p-1 border rounded-md text-sm bg-white disabled:bg-gray-100 disabled:border-transparent">
                        <option>USER</option><option>SUB_ADMIN</option><option>ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.lastActive).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => setPendingReset(user)} disabled={!canEdit(user)} className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400">Reset Pass</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pendingReset && (
          <ConfirmDialog 
              open={true}
              title="Reset Password?"
              message={`Are you sure you want to reset the password for ${pendingReset.email}? This action cannot be undone.`}
              onConfirm={confirmPasswordReset}
              onCancel={() => setPendingReset(null)}
          />
      )}
    </div>
  );
};

export default AdminDashboard;
