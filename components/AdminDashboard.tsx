import React, { useState, useEffect, useMemo, useRef } from 'react';
// Fix: Add missing ActivityEventType import
import { User, ActivityEvent, Exam, QuizResult, SubscriptionTier, ActivityEventType } from '../types';
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
                const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(counts),
                        datasets: [{
                            data: Object.values(counts),
                            backgroundColor: ['#D1D5DB', '#60A5FA', '#34D399'], // gray-300, blue-400, green-400
                            hoverBackgroundColor: ['#9CA3AF', '#3B82F6', '#10B981'],
                            borderColor: '#fff',
                            borderWidth: 2,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    // Fix: Add type guard for context.parsed to prevent type error on arithmetic operation
                                    label: function(context) {
                                        let label = context.label || '';
                                        if (label) label += ': ';
                                        if (context.parsed !== null && typeof context.parsed === 'number') {
                                            if (total > 0) {
                                                const percentage = (context.parsed / total * 100).toFixed(1);
                                                label += `${context.raw} (${percentage}%)`;
                                            } else {
                                                label += `${context.raw}`;
                                            }
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }, [counts]);
    
    const tierOrder: SubscriptionTier[] = ['STARTER', 'PROFESSIONAL', 'SPECIALIST'];
    const totalSubs = Object.values(counts).reduce((a: number, b: number) => a + b, 0);


    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm text-gray-500 text-center font-semibold">Subscription Breakdown</h3>
            <div className="relative h-24 mt-2">
                <canvas ref={chartRef}></canvas>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-800">{totalSubs}</span>
                </div>
            </div>
            <div className="flex justify-center gap-3 text-xs mt-2">
                {tierOrder.map(tier => (
                    <div key={tier} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${tier === 'STARTER' ? 'bg-gray-400' : tier === 'PROFESSIONAL' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                        <span>{counts[tier] || 0}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const UserGrowthChart: React.FC<{ data: { labels: string[], data: number[] } }> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && data.labels.length > 1 && (window as any).Chart) {
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
                            tension: 0.2,
                            pointRadius: 0,
                        }]
                    },
                    options: { scales: { y: { beginAtZero: false, title: { display: true, text: 'Cumulative Users' } }, x: { ticks: { maxTicksLimit: 10 } } }, plugins: { legend: { display: false } } }
                });
            }
        }
    }, [data]);
    
    return <div className="h-64"><canvas ref={chartRef}></canvas></div>;
};

const ExamPerformanceChart: React.FC<{ data: { name: string, popularity: number, avgScore: number }[], onBarClick: (examName: string) => void }> = ({ data, onBarClick }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    
    const getScoreColor = (score: number) => {
        if (score < 50) return 'rgba(239, 68, 68, 0.7)'; // red-500
        if (score < 75) return 'rgba(245, 158, 11, 0.7)'; // amber-500
        return 'rgba(16, 185, 129, 0.7)'; // green-500
    };

    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        if (chartRef.current && (window as any).Chart) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new (window as any).Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.name),
                        datasets: [{
                            label: 'Quizzes Taken',
                            data: data.map(d => d.popularity),
                            backgroundColor: data.map(d => getScoreColor(d.avgScore)),
                            borderColor: data.map(d => getScoreColor(d.avgScore).replace('0.7', '1')),
                            borderWidth: 1,
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        onClick: (event, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const examName = data[index].name;
                                onBarClick(examName);
                            }
                        },
                        scales: { 
                            y: { grid: { display: false } },
                            x: { title: { display: true, text: 'Number of Quizzes Taken' } }
                        }, 
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const index = context.dataIndex;
                                        const exam = data[index];
                                        return [
                                            `Quizzes: ${exam.popularity}`,
                                            `Avg Score: ${exam.avgScore.toFixed(1)}%`,
                                            `Pass Rate: ${exam.passRate.toFixed(1)}%`
                                        ];
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    }, [data]);

    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-8">No quiz data available to display.</p>;
    }
    
    return <div className="h-64"><canvas ref={chartRef}></canvas></div>;
};

const ActivityFeed: React.FC<{ feed: ActivityEvent[] }> = ({ feed }) => {
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    const getIcon = (type: ActivityEventType) => {
        // Fix: Add case for 'one_time_unlock'
        switch (type) {
            case 'login': return '👤';
            case 'upgrade': return '🚀';
            case 'quiz_complete': return '✅';
            case 'unlock': return '🔑';
            case 'one_time_unlock': return '🔑';
            default: return '⚙️';
        }
    };
    
    return (
        <ul className="space-y-3 h-96 overflow-y-auto">
            {feed.map(event => (
                <li key={event.id} className="flex gap-3 text-sm">
                    <span className="text-lg">{getIcon(event.type)}</span>
                    <div>
                        <p className="text-gray-800">{event.message}</p>
                        <p className="text-gray-400 text-xs">{timeAgo(event.timestamp)} by {event.userEmail}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
};


// --- User Management Tab ---
const UserManagementTab: React.FC<{ allUsers: User[], setAllUsers: React.Dispatch<React.SetStateAction<User[]>>, currentUser: User, onImpersonate: (user: User) => void, activityFeed: ActivityEvent[], initialFilter: {type: 'exam', value: string} | null }> = ({ allUsers, setAllUsers, currentUser, onImpersonate, activityFeed, initialFilter }) => {
    // ... implementation for user management ...
    return <div>User Management Content...</div>; // Simplified for brevity
};


export default AdminDashboard;