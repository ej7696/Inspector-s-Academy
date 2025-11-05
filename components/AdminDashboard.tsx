import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ActivityEvent, Exam, QuizResult, SubscriptionTier, ActivityEventType, Role } from '../types';
import api from '../services/apiService';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import ExamManager from './ExamManager';
import AnnouncementManager from './AnnouncementManager';

type Tab = 'dashboard' | 'users' | 'exams' | 'announcements';

const AdminDashboard: React.FC<{ onGoHome: () => void; currentUser: User, onImpersonate: (user: User) => void; }> = ({ onGoHome, currentUser, onImpersonate }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <MonitoringTab currentUser={currentUser} onSwitchTab={setActiveTab} />;
            case 'users':
                return <UserManagementTab currentUser={currentUser} onImpersonate={onImpersonate} />;
            case 'exams':
                return <ExamManager />;
            case 'announcements':
                return <AnnouncementManager />;
            default:
                return null;
        }
    };
    
    const canManageAnnouncements = currentUser.role === 'ADMIN' || currentUser.permissions?.canManageAnnouncements;
    const canManageExams = currentUser.role === 'ADMIN' || currentUser.permissions?.canManageExams;
    const canViewUsers = currentUser.role === 'ADMIN' || currentUser.permissions?.canViewUserList;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <button onClick={onGoHome} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    &larr; Back to Home
                </button>
            </div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton name="Dashboard" tab="dashboard" activeTab={activeTab} onClick={setActiveTab} />
                    {canViewUsers && <TabButton name="User Management" tab="users" activeTab={activeTab} onClick={setActiveTab} />}
                    {canManageExams && <TabButton name="Exam Content" tab="exams" activeTab={activeTab} onClick={setActiveTab} />}
                    {canManageAnnouncements && <TabButton name="Announcements" tab="announcements" activeTab={activeTab} onClick={setActiveTab} />}
                </nav>
            </div>
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

// --- Sub Components for Tabs ---

const TabButton: React.FC<{ name: string; tab: Tab; activeTab: Tab; onClick: (tab: Tab) => void }> = ({ name, tab, activeTab, onClick }) => (
    <button
        onClick={() => onClick(tab)}
        className={`${
        activeTab === tab
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
    >
        {name}
    </button>
);

const MonitoringTab: React.FC<{ currentUser: User; onSwitchTab: (tab: Tab) => void }> = ({ currentUser, onSwitchTab }) => {
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers7d: 0, newSignupsMonth: 0 });
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
    const [activityFilter, setActivityFilter] = useState<ActivityEventType | 'all'>('all');
    
    useEffect(() => {
        const fetchData = async () => {
            const [users, feed, exams] = await Promise.all([api.getAllUsers(), api.fetchActivityFeed(), api.getExams()]);
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            const monthStart = new Date(now);
            monthStart.setDate(1);
            monthStart.setHours(0,0,0,0);

            setAllUsers(users);
            const allHistory = users.flatMap(u => u.history);
            setQuizHistory(allHistory);
            
            setStats({
                totalUsers: users.length,
                activeUsers7d: users.filter(u => u.lastActive > sevenDaysAgo).length,
                newSignupsMonth: users.filter(u => u.createdAt > monthStart.getTime()).length
            });
            setActivity(feed);
        };
        fetchData();
        const intervalId = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(intervalId);
    }, []);
    
    const subscriptionBreakdown = useMemo(() => {
        return allUsers.reduce((acc, user) => {
            acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
            return acc;
        }, {} as Record<SubscriptionTier, number>);
    }, [allUsers]);

    const examPerformance = useMemo(() => {
        const performanceData: { [examName: string]: { quizzesTaken: number; totalScore: number } } = {};
        quizHistory.forEach(result => {
            if (!performanceData[result.examName]) {
                performanceData[result.examName] = { quizzesTaken: 0, totalScore: 0 };
            }
            performanceData[result.examName].quizzesTaken++;
            performanceData[result.examName].totalScore += result.percentage;
        });
        return Object.entries(performanceData).map(([examName, data]) => ({
            examName,
            avgScore: data.totalScore / data.quizzesTaken,
            quizzesTaken: data.quizzesTaken
        })).sort((a,b) => b.quizzesTaken - a.quizzesTaken);
    }, [quizHistory]);

    const userGrowth = useMemo(() => {
        const sortedUsers = [...allUsers].sort((a,b) => a.createdAt - b.createdAt);
        const labels: string[] = [];
        const data: number[] = [];
        if (sortedUsers.length > 0) {
            let currentDate = new Date(sortedUsers[0].createdAt);
            currentDate.setHours(0,0,0,0);
            let count = 0;
            let userIndex = 0;
            while(currentDate <= new Date()) {
                while(userIndex < sortedUsers.length && new Date(sortedUsers[userIndex].createdAt) < currentDate) {
                    count++;
                    userIndex++;
                }
                labels.push(currentDate.toLocaleDateString());
                data.push(count);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return { labels, data };
    }, [allUsers]);

    const filteredActivity = activity.filter(a => activityFilter === 'all' || a.type === activityFilter);
    
    const canViewAnalytics = currentUser.role === 'ADMIN' || currentUser.permissions?.canAccessPerformanceAnalytics;
    const canViewBilling = currentUser.role === 'ADMIN' || currentUser.permissions?.canViewBillingSummary;
    const canViewActivity = currentUser.role === 'ADMIN' || currentUser.permissions?.canViewActivityLogs;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={stats.totalUsers.toString()} />
                <StatCard title="Active Users (7d)" value={stats.activeUsers7d.toString()} />
                <StatCard title="New Signups (This Month)" value={stats.newSignupsMonth.toString()} />
                {canViewBilling && <StatCard title="Subscription Breakdown"><DonutChart data={subscriptionBreakdown} /></StatCard>}
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 {canViewAnalytics && <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-md">
                     <h3 className="font-semibold text-gray-700 mb-2">Exam Popularity & Performance</h3>
                     <BarChart data={examPerformance} onBarClick={() => onSwitchTab('users')} />
                 </div>}
                 {canViewAnalytics && <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
                     <h3 className="font-semibold text-gray-700 mb-2">User Growth Trajectory</h3>
                     <LineChart data={userGrowth} />
                 </div>}
             </div>
            {canViewActivity && <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-gray-700">Real-Time Activity Feed</h3>
                     <select value={activityFilter} onChange={e => setActivityFilter(e.target.value as any)} className="text-sm p-1 border rounded-md">
                         <option value="all">All Activity</option>
                         <option value="login">Logins</option>
                         <option value="upgrade">Upgrades</option>
                         <option value="unlock">Unlocks</option>
                         <option value="quiz_complete">Quiz Completions</option>
                     </select>
                </div>
                <ul className="h-48 overflow-y-auto text-sm space-y-2">
                    {filteredActivity.map(event => (
                        <li key={event.id} className="flex items-center gap-2">
                           <span className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span> 
                           <span className="font-semibold text-gray-600">{event.userEmail}</span>
                           <span className="text-gray-500">{event.message}</span>
                        </li>
                    ))}
                </ul>
            </div>}
        </div>
    );
};

const UserManagementTab: React.FC<{ currentUser: User; onImpersonate: (user: User) => void }> = ({ currentUser, onImpersonate }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<{ tier: SubscriptionTier | 'all', role: Role | 'all' }>({ tier: 'all', role: 'all' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        const userData = await api.getAllUsers();
        setUsers(userData);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users.filter(user => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filter.tier !== 'all') {
            result = result.filter(user => user.subscriptionTier === filter.tier);
        }
        if (filter.role !== 'all') {
            result = result.filter(user => user.role === filter.role);
        }
        setFilteredUsers(result);
    }, [searchTerm, filter, users]);

    const handleAddUser = async (newUser: any) => {
        await api.addUser(newUser);
        fetchUsers();
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const canEditUsers = currentUser.role === 'ADMIN' || !!currentUser.permissions?.canEditUsers;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                 <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md"
                    />
                    <select value={filter.tier} onChange={e => setFilter({...filter, tier: e.target.value as any})} className="p-2 border rounded-md">
                         <option value="all">All Tiers</option>
                         <option value="STARTER">Starter</option>
                         <option value="PROFESSIONAL">Professional</option>
                         <option value="SPECIALIST">Specialist</option>
                    </select>
                     <select value={filter.role} onChange={e => setFilter({...filter, role: e.target.value as any})} className="p-2 border rounded-md">
                         <option value="all">All Roles</option>
                         <option value="USER">User</option>
                         <option value="SUB_ADMIN">Sub-Admin</option>
                         <option value="ADMIN">Admin</option>
                    </select>
                </div>
                <div className="flex gap-2">
                     {currentUser.role === 'ADMIN' && (
                        <button onClick={api.exportAllUsersAsCSV} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700">
                            Export Users (CSV)
                        </button>
                     )}
                     <button onClick={() => setIsAddModalOpen(true)} disabled={!canEditUsers} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400">
                        + Add New User
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exams Taken</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Score</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(user => {
                            const avgScore = user.history.length > 0 ? user.history.reduce((acc, h) => acc + h.percentage, 0) / user.history.length : 0;
                            const canBeEdited = currentUser.role === 'ADMIN' || (canEditUsers && user.role === 'USER');
                            return (
                                <tr key={user.id}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <p className="font-semibold">{user.fullName || 'N/A'}</p>
                                        <p className="text-gray-500">{user.email}</p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionTier === 'SPECIALIST' ? 'bg-green-100 text-green-800' : user.subscriptionTier === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {user.subscriptionTier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">{user.history.length}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">{avgScore > 0 ? `${avgScore.toFixed(1)}%` : '--'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-gray-500">{new Date(user.lastActive).toLocaleString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                                        <button onClick={() => setEditingUser(user)} disabled={!canBeEdited} className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed">Edit</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddUser={handleAddUser} />
            {editingUser && (
                <EditUserModal 
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                    currentUser={currentUser}
                    onUpdateUser={handleUpdateUser}
                    onImpersonate={onImpersonate}
                />
            )}
        </div>
    );
};

// --- Chart Components ---
const StatCard: React.FC<{ title: string; value?: string; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-sm text-gray-500 font-semibold">{title}</p>
        {value && <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>}
        {children && <div className="mt-2">{children}</div>}
    </div>
);

const DonutChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (chartRef.current && (window as any).Chart) {
            const chart = new (window as any).Chart(chartRef.current, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: ['#d1d5db', '#60a5fa', '#34d399'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }
            });
            return () => chart.destroy();
        }
    }, [data]);
    return <div className="h-24 w-full"><canvas ref={chartRef}></canvas></div>;
};

const BarChart: React.FC<{ data: { examName: string, avgScore: number, quizzesTaken: number }[], onBarClick: (examName: string) => void }> = ({ data, onBarClick }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (chartRef.current && (window as any).Chart) {
            const chart = new (window as any).Chart(chartRef.current, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.examName),
                    datasets: [{ label: 'Avg Score', data: data.map(d => d.avgScore), backgroundColor: '#60a5fa' }]
                },
                options: {
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true, max: 100 } },
                    onClick: (e: any) => {
                        const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                        if (points.length) onBarClick(data[points[0].index].examName);
                    },
                    plugins: { 
                        tooltip: { 
                            callbacks: {
                                label: function(context: any) {
                                    if(typeof context.parsed?.x === 'number') {
                                        const item = data[context.dataIndex];
                                        return `Avg Score: ${item.avgScore.toFixed(1)}% | Quizzes: ${item.quizzesTaken}`;
                                    }
                                    return '';
                                }
                            }
                        }
                    }
                }
            });
            return () => chart.destroy();
        }
    }, [data, onBarClick]);
    return <canvas ref={chartRef}></canvas>;
};

const LineChart: React.FC<{ data: { labels: string[], data: number[] } }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (chartRef.current && (window as any).Chart && data.labels.length > 0) {
            const chart = new (window as any).Chart(chartRef.current, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{ label: 'Total Users', data: data.data, borderColor: '#34d399', tension: 0.1, fill: false }]
                },
                options: { plugins: { legend: { display: false } } }
            });
            return () => chart.destroy();
        }
    }, [data]);
    return <canvas ref={chartRef}></canvas>;
};

export default AdminDashboard;
