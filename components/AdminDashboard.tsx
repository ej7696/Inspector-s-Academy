import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ActivityEvent, Exam } from '../types';
import api from '../services/apiService';
import AddUserModal from './AddUserModal';
import ConfirmDialog from './ConfirmDialog';
import EditUserModal from './EditUserModal';
import ExamManager from './ExamManager';
import AnnouncementManager from './AnnouncementManager';


type Tab = 'dashboard' | 'users' | 'exams' | 'announcements';

const AdminDashboard: React.FC<{ onGoHome: () => void; currentUser: User, onImpersonate: (user: User) => void; }> = ({ onGoHome, currentUser, onImpersonate }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const fetchAllData = async () => {
    try {
      const [users, activities] = await Promise.all([
        api.getAllUsers(),
        api.fetchActivityFeed(),
      ]);
      setAllUsers(users);
      setActivityFeed(activities.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000); // Refresh data every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const TABS: { id: Tab, label: string }[] = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'users', label: 'User Management' },
      { id: 'exams', label: 'Exam Content' },
      { id: 'announcements', label: 'Announcements' },
  ];

  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard':
              return <MonitoringTab users={allUsers} activityFeed={activityFeed} />;
          case 'users':
              return <UserManagementTab allUsers={allUsers} setAllUsers={setAllUsers} currentUser={currentUser} onImpersonate={onImpersonate} />;
          case 'exams':
              return <ExamManager />;
          case 'announcements':
              return <AnnouncementManager />;
          default:
              return null;
      }
  };


  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button onClick={onGoHome} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors self-start sm:self-center">
            &larr; Back to Home
            </button>
        </div>

        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                            activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-6">
            {isLoading ? <p>Loading dashboard...</p> : renderContent()}
        </div>
    </div>
  );
};


const MonitoringTab: React.FC<{ users: User[], activityFeed: ActivityEvent[] }> = ({ users, activityFeed }) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => Date.now() - u.lastActive < 7 * 24 * 60 * 60 * 1000).length;

    const subscriptionCounts = users.reduce((acc, user) => {
        acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const quizzesToday = users.reduce((acc, user) => {
        return acc + user.history.filter(h => Date.now() - h.date < 24 * 60 * 60 * 1000).length;
    }, 0);

    const examPerformance = useMemo(() => {
        const examStats: { [name: string]: { total: number; correct: number, count: number } } = {};
        users.forEach(user => {
            user.history.forEach(result => {
                if (!examStats[result.examName]) {
                    examStats[result.examName] = { total: 0, correct: 0, count: 0 };
                }
                examStats[result.examName].total += result.totalQuestions;
                examStats[result.examName].correct += result.score;
                examStats[result.examName].count++;
            });
        });

        return Object.entries(examStats).map(([name, stats]) => ({
            name,
            popularity: stats.count,
            avgScore: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        })).sort((a,b) => b.popularity - a.popularity);
    }, [users]);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={totalUsers.toString()} />
                    <StatCard title="Active Users (7d)" value={activeUsers.toString()} />
                    <StatCard title="Quizzes Today" value={quizzesToday.toString()} />
                    <StatCard title="Specialists" value={(subscriptionCounts['Specialist'] || 0).toString()} />
                </div>
                {/* Exam Performance Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-gray-700 mb-4">Exam Popularity & Performance</h3>
                     <ExamPerformanceChart data={examPerformance} />
                </div>
            </div>
             {/* Activity Feed */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Real-Time Activity Feed</h3>
                <ActivityFeed feed={activityFeed} />
            </div>
        </div>
    );
};

const UserManagementTab: React.FC<{ allUsers: User[], setAllUsers: React.Dispatch<React.SetStateAction<User[]>>, currentUser: User, onImpersonate: (user: User) => void; }> = ({ allUsers, setAllUsers, currentUser, onImpersonate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const filteredUsers = useMemo(() => {
        return allUsers
          .filter(user => {
            const term = searchTerm.toLowerCase();
            return user.email.toLowerCase().includes(term) || (user.fullName || '').toLowerCase().includes(term);
          })
          .filter(user => {
            if (filter === 'All') return true;
            if (['ADMIN', 'SUB_ADMIN', 'USER'].includes(filter)) return user.role === filter;
            return user.subscriptionTier === filter;
          })
          .sort((a,b) => a.email.localeCompare(b.email));
    }, [allUsers, searchTerm, filter]);

    const handleUserAdd = async (newUser: any) => {
        const createdUser = await api.addUser(newUser);
        setAllUsers(prev => [createdUser, ...prev]);
    };
    
    const handleUserUpdate = (updatedUser: User) => {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">User Management ({allUsers.length})</h2>
                 <button onClick={() => setIsAddUserModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    + Add New User
                </button>
            </div>
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                 <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="md:col-span-2 w-full p-2 border border-gray-300 rounded-md"
                />
                <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option>All</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUB_ADMIN">SUB_ADMIN</option>
                    <option value="USER">USER</option>
                    <option value="Specialist">Specialist Tier</option>
                    <option value="Professional">Professional Tier</option>
                    <option value="Cadet">Cadet Tier</option>
                </select>
            </div>
            {/* User Table */}
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
                       {filteredUsers.map(user => (
                           <tr key={user.id}>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                                   <div className="text-sm text-gray-500">{user.email}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionTier === 'Specialist' ? 'bg-green-100 text-green-800' : user.subscriptionTier === 'Professional' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.subscriptionTier}</span>
                                   <div className="text-sm text-gray-500">{user.role}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>Last Active: {new Date(user.lastActive).toLocaleDateString()}</div>
                                    <div>Quizzes: {user.history.length}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                   <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900">Manage</button>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>
             <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onAddUser={handleUserAdd} />
             {editingUser && (
                <EditUserModal 
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                    currentUser={currentUser}
                    onUpdateUser={handleUserUpdate}
                    onImpersonate={onImpersonate}
                />
             )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
);

const ActivityFeed: React.FC<{ feed: ActivityEvent[] }> = ({ feed }) => {
    const timeSince = (date: number) => {
        const seconds = Math.floor((Date.now() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };
    
    const getActivityIcon = (type: ActivityEvent['type']) => {
        const icons: Record<ActivityEvent['type'], string> = {
            'login': '👤', 'upgrade': '⭐', 'unlock': '🔓', 'quiz_complete': '✅', 'one_time_unlock': '🔑'
        };
        return <span className="text-lg mr-3">{icons[type] || '🔔'}</span>;
    };
    
    return (
        <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {feed.map(event => (
                <li key={event.id} className="flex items-start text-sm">
                    {getActivityIcon(event.type)}
                    <div>
                        <p className="text-gray-800">{event.message}</p>
                        <p className="text-xs text-gray-400">{timeSince(event.timestamp)} by {event.userEmail}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const ExamPerformanceChart: React.FC<{ data: { name: string; popularity: number; avgScore: number }[] }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current && data.length > 0 && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const getScoreColor = (score: number) => {
                    if (score < 60) return 'rgba(239, 68, 68, 0.7)'; // red
                    if (score < 80) return 'rgba(245, 158, 11, 0.7)'; // amber
                    return 'rgba(22, 163, 74, 0.7)'; // green
                };
                
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.name),
                        datasets: [{
                            label: 'Quizzes Taken',
                            data: data.map(d => d.popularity),
                            backgroundColor: data.map(d => getScoreColor(d.avgScore)),
                            borderColor: data.map(d => getScoreColor(d.avgScore).replace('0.7', '1')),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        scales: { x: { beginAtZero: true, title: { display: true, text: 'Number of Quizzes Taken' } } },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (c: any) => `Quizzes Taken: ${c.raw}`,
                                    afterLabel: (c: any) => `Avg. Score: ${data[c.dataIndex].avgScore.toFixed(1)}%`
                                }
                            }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [data]);
    
    if (data.length === 0) {
        return <p className="text-center text-gray-500">No quiz data available to display.</p>
    }

    return <canvas ref={chartRef}></canvas>;
};


export default AdminDashboard;
