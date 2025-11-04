import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Imported QuizResult type
import { User, ActivityEvent, Exam, QuizResult } from '../types';
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
  const [userFilter, setUserFilter] = useState<{ type: 'exam', value: string } | null>(null);


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
  
  const TABS: { id: Tab, label: string, adminOnly: boolean, permission?: keyof User['permissions'] }[] = [
      { id: 'dashboard', label: 'Dashboard', adminOnly: false },
      { id: 'users', label: 'User Management', adminOnly: false },
      { id: 'exams', label: 'Exam Content', adminOnly: true },
      { id: 'announcements', label: 'Announcements', adminOnly: false, permission: 'canManageAnnouncements' },
  ];
  
  const visibleTabs = TABS.filter(tab => {
      if (currentUser.role === 'ADMIN') return true;
      if (currentUser.role === 'SUB_ADMIN') {
          if (tab.adminOnly) return false;
          if (tab.permission) return currentUser.permissions?.[tab.permission] === true;
          return true;
      }
      return false;
  });

  const handleExamChartClick = (examName: string) => {
      setUserFilter({ type: 'exam', value: examName });
      setActiveTab('users');
  };


  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard':
              return <MonitoringTab users={allUsers} activityFeed={activityFeed} onExamChartClick={handleExamChartClick} onQuickNav={(tab) => setActiveTab(tab)} />;
          case 'users':
              return <UserManagementTab allUsers={allUsers} setAllUsers={setAllUsers} currentUser={currentUser} onImpersonate={onImpersonate} activityFeed={activityFeed} initialFilter={userFilter} />;
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
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setUserFilter(null); // Clear filter when changing tabs
                        }}
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


const MonitoringTab: React.FC<{ users: User[], activityFeed: ActivityEvent[], onExamChartClick: (examName: string) => void, onQuickNav: (tab: Tab) => void }> = ({ users, activityFeed, onExamChartClick, onQuickNav }) => {
    const [activityFilter, setActivityFilter] = useState<ActivityEvent['type'] | 'all'>('all');
    
    const stats = useMemo(() => {
        const now = Date.now();
        const last7Days = 7 * 24 * 60 * 60 * 1000;
        const last14Days = 14 * 24 * 60 * 60 * 1000;
        const last30Days = 30 * 24 * 60 * 60 * 1000;
        const last60Days = 60 * 24 * 60 * 60 * 1000;

        const currentActive = users.filter(u => now - u.lastActive < last7Days).length;
        const prevActive = users.filter(u => now - u.lastActive >= last7Days && now - u.lastActive < last14Days).length;

        const currentTotal = users.length;
        const prevTotal = users.filter(u => now - u.createdAt > last30Days).length;
        
        const newSignupsThisMonth = users.filter(u => now - u.createdAt < last30Days).length;

        const subscriptionCounts = users.reduce((acc, user) => {
            acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const quizzesToday = users.reduce((acc, user) => {
            return acc + user.history.filter(h => now - h.date < 24 * 60 * 60 * 1000).length;
        }, 0);
        
        return {
            totalUsers: { value: currentTotal, trend: prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0 },
            activeUsers: { value: currentActive, trend: prevActive > 0 ? ((currentActive - prevActive) / prevActive) * 100 : 0 },
            newSignups: { value: newSignupsThisMonth },
            subscriptionCounts,
            quizzesToday,
        };
    }, [users]);
    
    const userGrowthData = useMemo(() => {
        const last90Days = 90 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const recentUsers = users.filter(u => now - u.createdAt < last90Days);
        const dailySignups = recentUsers.reduce((acc, user) => {
            const date = new Date(user.createdAt).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const labels: string[] = [];
        const data: number[] = [];
        let cumulative = users.length - recentUsers.length;
        for (let i = 89; i >= 0; i--) {
            const d = new Date(now - i * 24 * 60 * 60 * 1000);
            const dateKey = d.toISOString().split('T')[0];
            labels.push(dateKey);
            cumulative += (dailySignups[dateKey] || 0);
            data.push(cumulative);
        }
        return { labels, data };
    }, [users]);


    const filteredActivity = useMemo(() => {
        if (activityFilter === 'all') return activityFeed;
        return activityFeed.filter(event => event.type === activityFilter);
    }, [activityFeed, activityFilter]);
    
    const examPerformance = useMemo(() => {
        const examStats: { [name: string]: { quizzes: QuizResult[] } } = {};
        users.forEach(user => {
            user.history.forEach(result => {
                if (!examStats[result.examName]) {
                    examStats[result.examName] = { quizzes: [] };
                }
                examStats[result.examName].quizzes.push(result);
            });
        });

        return Object.entries(examStats).map(([name, stats]) => {
            const totalQuizzes = stats.quizzes.length;
            const avgScore = totalQuizzes > 0 ? stats.quizzes.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes : 0;
            const passRate = totalQuizzes > 0 ? (stats.quizzes.filter(q => q.percentage >= 70).length / totalQuizzes) * 100 : 0;
            return { name, popularity: totalQuizzes, avgScore, passRate };
        }).sort((a,b) => b.popularity - a.popularity);
    }, [users]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>{/* Placeholder for potential title */}</div>
                <QuickActions onNav={onQuickNav}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Users" value={stats.totalUsers.value.toString()} trend={stats.totalUsers.trend} trendPeriod="vs last month" />
                <StatCard title="Active Users (7d)" value={stats.activeUsers.value.toString()} trend={stats.activeUsers.trend} trendPeriod="vs last week" />
                <StatCard title="New Signups (30d)" value={stats.newSignups.value.toString()} />
                <StatCard title="Quizzes Today" value={stats.quizzesToday.toString()} />
                <SubscriptionDonutCard counts={stats.subscriptionCounts} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-gray-700 mb-4">Exam Popularity & Performance</h3>
                     <ExamPerformanceChart data={examPerformance} onBarClick={onExamChartClick} />
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Real-Time Activity Feed</h3>
                        <select value={activityFilter} onChange={e => setActivityFilter(e.target.value as any)} className="text-xs p-1 border rounded-md">
                            <option value="all">All</option>
                            <option value="login">Logins</option>
                            <option value="upgrade">Upgrades</option>
                            <option value="quiz_complete">Quiz Completions</option>
                        </select>
                    </div>
                    <ActivityFeed feed={filteredActivity} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">User Growth Trajectory (90d)</h3>
                <UserGrowthChart data={userGrowthData} />
            </div>
        </div>
    );
};

const QuickActions: React.FC<{onNav: (tab: Tab) => void}> = ({onNav}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    }
    
    // Placeholder for Add User Modal trigger - would be handled in UserManagementTab
    const addUser = () => alert("Navigate to 'User Management' to add a user.");
    const createAnnouncement = () => onNav('announcements');
    const exportData = () => alert("Navigate to 'User Management' to export data.");


    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2">
                Quick Actions <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleAction(addUser) }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">+ Add New User</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleAction(createAnnouncement) }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Create Announcement</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleAction(exportData) }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export All User Data</a>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatCard: React.FC<{ title: string; value: string; trend?: number, trendPeriod?: string }> = ({ title, value, trend, trendPeriod }) => {
    const trendColor = trend && trend >= 0 ? 'text-green-600' : 'text-red-600';
    const trendIcon = trend && trend >= 0 ? '▲' : '▼';
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <p className="text-sm text-gray-500 truncate">{title}</p>
            <p className="text-3xl font-bold text-gray-800 my-1">{value}</p>
            {trend !== undefined ? (
                <p className={`text-xs font-semibold ${trendColor}`}>{trendIcon} {Math.abs(trend).toFixed(1)}% <span className="font-normal text-gray-400">{trendPeriod}</span></p>
            ) : (
                <p className="text-xs">&nbsp;</p> 
            )}
        </div>
    );
};


const SubscriptionDonutCard: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                // FIX: Add explicit types to reduce function parameters
                const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(counts),
                        datasets: [{
                            data: Object.values(counts),
                            backgroundColor: ['#D1D5DB', '#60A5FA', '#34D399'], // gray, blue, green
                            borderWidth: 0,
                        }]
                    },
                    options: {
                        responsive: true,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true }
                        }
                    }
                });
            }
        }
    }, [counts]);
    
    // FIX: Add explicit types to reduce function parameters
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col justify-between">
            <p className="text-sm text-gray-500">Subscription Breakdown</p>
            <div className="relative w-24 h-24 mx-auto my-2">
                <canvas ref={chartRef}></canvas>
                <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-2xl font-bold">{total}</span>
                </div>
            </div>
             <div className="flex justify-center gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span>Cadet: {counts.Cadet || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Pro: {counts.Professional || 0}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Spec: {counts.Specialist || 0}</span>
            </div>
        </div>
    );
};

const UserGrowthChart: React.FC<{data: { labels: string[], data: number[] }}> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                 chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Total Users',
                            data: data.data,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            tension: 0.1,
                            pointRadius: 0,
                        }]
                    },
                    options: { 
                        scales: { x: { display: false }, y: { beginAtZero: false } }, 
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    }, [data]);

    return <canvas ref={chartRef} height="80"></canvas>;
}


const UserManagementTab: React.FC<{ allUsers: User[], setAllUsers: React.Dispatch<React.SetStateAction<User[]>>, currentUser: User, onImpersonate: (user: User) => void, activityFeed: ActivityEvent[], initialFilter: {type: 'exam', value: string} | null }> = ({ allUsers, setAllUsers, currentUser, onImpersonate, activityFeed, initialFilter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const [viewingUserActivity, setViewingUserActivity] = useState<User | null>(null);
    const [pendingPasswordReset, setPendingPasswordReset] = useState<User | null>(null);

    useEffect(() => {
        if (initialFilter?.type === 'exam') {
            const usersWithExam = allUsers.filter(u => u.history.some(h => h.examName === initialFilter.value)).map(u => u.email).join(',');
            setSearchTerm(usersWithExam);
        }
    }, [initialFilter, allUsers]);


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
          .sort((a,b) => b.createdAt - a.createdAt);
    }, [allUsers, searchTerm, filter]);

    const handleUserAdd = async (newUser: any) => {
        const createdUser = await api.addUser(newUser);
        setAllUsers(prev => [createdUser, ...prev]);
    };
    
    const handleUserUpdate = (updatedUser: User) => {
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };
    
    const handleExportCSV = () => {
        const headers = ['User ID', 'Full Name', 'Email', 'Subscription Tier', 'Role', 'Last Active', 'Quizzes Taken', 'Avg Score'];
        const rows = filteredUsers.map(user => [
            user.id,
            user.fullName || '',
            user.email,
            user.subscriptionTier,
            user.role,
            new Date(user.lastActive).toISOString(),
            user.history.length,
            calculateAverageScore(user)
        ].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getUserStatus = (lastActive: number): { color: string, text: string } => {
        const daysSinceActive = (Date.now() - lastActive) / (1000 * 3600 * 24);
        if (daysSinceActive < 7) return { color: 'bg-green-500', text: 'Active' };
        if (daysSinceActive < 30) return { color: 'bg-yellow-500', text: 'Idle' };
        return { color: 'bg-gray-500', text: 'Dormant' };
    };

    const calculateAverageScore = (user: User) => {
        if (user.history.length === 0) return 'N/A';
        const avg = user.history.reduce((acc, h) => acc + h.percentage, 0) / user.history.length;
        return `${avg.toFixed(1)}%`;
    };

    const getUnlockedExamsText = (user: User) => {
        if (user.subscriptionTier === 'Cadet') return 'N/A';
        const limit = user.subscriptionTier === 'Professional' ? 1 : 2;
        return `${user.unlockedExams.length} / ${limit}`;
    };

    const handleSuspendToggle = async (user: User) => {
        const updatedUser = await api.updateUser(user.id, { isSuspended: !user.isSuspended });
        handleUserUpdate(updatedUser);
        setOpenActionMenu(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">User Management ({allUsers.length})</h2>
                <div className="flex gap-2">
                    {currentUser.role === 'ADMIN' && (
                        <button onClick={handleExportCSV} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm">Export to CSV</button>
                    )}
                    <button onClick={() => setIsAddUserModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        + Add New User
                    </button>
                </div>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unlocked Exams</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {filteredUsers.map(user => {
                           const status = getUserStatus(user.lastActive);
                           const canManageUser = currentUser.role === 'ADMIN' || (currentUser.role === 'SUB_ADMIN' && user.role === 'USER');

                           return (
                               <tr key={user.id}>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                       <div className="flex items-center">
                                           <span className={`h-2.5 w-2.5 rounded-full ${status.color} mr-2`} title={status.text}></span>
                                           <div>
                                               <div className="font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                                               <div className="text-sm text-gray-500">{user.email}</div>
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionTier === 'Specialist' ? 'bg-green-100 text-green-800' : user.subscriptionTier === 'Professional' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.subscriptionTier}</span>
                                       <div className="text-sm text-gray-500">{user.role}</div>
                                       <div className="text-xs text-gray-400">Expires: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Quizzes: {user.history.length}</div>
                                        <div>Avg Score: {calculateAverageScore(user)}</div>
                                   </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getUnlockedExamsText(user)}
                                    </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                       <div className="relative">
                                           <button onClick={() => setOpenActionMenu(openActionMenu === user.id ? null : user.id)} disabled={!canManageUser} className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                           </button>
                                           {openActionMenu === user.id && canManageUser && (
                                               <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                   <div className="py-1" role="menu" aria-orientation="vertical">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); setEditingUser(user); setOpenActionMenu(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">View/Manage Profile</a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); setViewingUserActivity(user); setOpenActionMenu(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">View Activity Log</a>
                                                        {(currentUser.role === 'ADMIN' || currentUser.permissions?.canSendPasswordResets) && <a href="#" onClick={(e) => { e.preventDefault(); setPendingPasswordReset(user); setOpenActionMenu(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Send Password Reset</a>}
                                                        {currentUser.role === 'ADMIN' && currentUser.id !== user.id && <a href="#" onClick={(e) => { e.preventDefault(); onImpersonate(user); setOpenActionMenu(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Impersonate User</a>}
                                                        {(currentUser.role === 'ADMIN' || currentUser.permissions?.canSuspendUsers) && currentUser.id !== user.id && <a href="#" onClick={(e) => { e.preventDefault(); handleSuspendToggle(user); }} className={`block px-4 py-2 text-sm hover:bg-gray-100 ${user.isSuspended ? 'text-green-600' : 'text-red-600'}`} role="menuitem">{user.isSuspended ? 'Unsuspend User' : 'Suspend User'}</a>}
                                                   </div>
                                               </div>
                                           )}
                                       </div>
                                   </td>
                               </tr>
                           );
                       })}
                    </tbody>
                </table>
            </div>
            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onAddUser={handleUserAdd} />
            {editingUser && <EditUserModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} currentUser={currentUser} onUpdateUser={handleUserUpdate} onImpersonate={onImpersonate} />}
            {viewingUserActivity && <UserActivityModal user={viewingUserActivity} allActivity={activityFeed} onClose={() => setViewingUserActivity(null)} />}
            {pendingPasswordReset && <ConfirmDialog open={true} title="Reset Password?" message={`Are you sure you want to send a password reset email to ${pendingPasswordReset.email}?`} onCancel={() => setPendingPasswordReset(null)} onConfirm={async () => { await api.sendPasswordReset(pendingPasswordReset.email); setPendingPasswordReset(null); }} />}
        </div>
    );
};

const UserActivityModal: React.FC<{ user: User, allActivity: ActivityEvent[], onClose: () => void }> = ({ user, allActivity, onClose }) => {
    const userActivity = allActivity.filter(e => e.userId === user.id);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">Activity Log for {user.fullName || user.email}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {userActivity.length > 0 ? (
                        <ActivityFeed feed={userActivity} />
                    ) : (
                        <p className="text-center text-gray-500 py-10">No activity recorded for this user.</p>
                    )}
                </div>
             </div>
        </div>
    )
}


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

const ExamPerformanceChart: React.FC<{ data: { name: string; popularity: number; avgScore: number, passRate: number }[], onBarClick: (examName: string) => void }> = ({ data, onBarClick }) => {
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
                        onClick: (e: any) => {
                            const activePoints = chartInstance.current.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                            if (activePoints.length) {
                                const firstPoint = activePoints[0];
                                const label = chartInstance.current.data.labels[firstPoint.index];
                                onBarClick(label);
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (c: any) => `Quizzes Taken: ${c.raw}`,
                                    afterLabel: (c: any) => [
                                        `Avg. Score: ${data[c.dataIndex].avgScore.toFixed(1)}%`,
                                        `Pass Rate: ${data[c.dataIndex].passRate.toFixed(1)}%`
                                    ]
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
    }, [data, onBarClick]);
    
    if (data.length === 0) {
        return <p className="text-center text-gray-500">No quiz data available to display.</p>
    }

    return <canvas ref={chartRef}></canvas>;
};


export default AdminDashboard;
