
import React, { useState, useEffect, useMemo } from 'react';
import { ActivityEvent } from '../types';
import api from '../services/apiService';

const GrowthAnalyticsTab: React.FC = () => {
    const [activity, setActivity] = useState<ActivityEvent[]>([]);

    useEffect(() => {
        const fetchFeed = async () => {
            const feed = await api.fetchActivityFeed();
            setActivity(feed);
        };
        fetchFeed();
    }, []);

    const stats = useMemo(() => {
        const signups = activity.filter(a => a.type === 'user_signup').length;
        const paywallViews = activity.filter(a => a.type === 'view_paywall').length;
        const upgrades = activity.filter(a => a.type === 'upgrade').length;
        const leads = activity.filter(a => a.type === 'lead_captured').length;
        const samplesCompleted = activity.filter(a => a.type === 'sample_quiz_completed').length;
        
        const conversionRate = paywallViews > 0 ? (upgrades / paywallViews) * 100 : 0;

        return { signups, paywallViews, upgrades, leads, samplesCompleted, conversionRate };
    }, [activity]);
    
    const signupsByDay = useMemo(() => {
        const dailyCounts: { [date: string]: number } = {};
        activity
            .filter(e => e.type === 'user_signup')
            .forEach(event => {
                const date = new Date(event.timestamp).toLocaleDateString();
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            });
        
        const sortedDates = Object.keys(dailyCounts).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        
        return {
            labels: sortedDates,
            data: sortedDates.map(date => dailyCounts[date])
        };
    }, [activity]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">B2C Growth & Funnel Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard title="New Signups" value={stats.signups.toString()} />
                <StatCard title="Paywall Views" value={stats.paywallViews.toString()} />
                <StatCard title="Upgrades" value={stats.upgrades.toString()} />
                <StatCard title="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} />
                <StatCard title="Leads Captured" value={stats.leads.toString()} />
            </div>
             <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                     <h3 className="font-semibold text-gray-700 mb-2">Signup Trend</h3>
                     <LineChart data={signupsByDay} />
                 </div>
             </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-sm text-gray-500 font-semibold">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
);

const LineChart: React.FC<{ data: { labels: string[], data: number[] } }> = ({ data }) => {
    const chartRef = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        if (chartRef.current && (window as any).Chart && data.labels.length > 0) {
            const chart = new (window as any).Chart(chartRef.current, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{ label: 'Signups', data: data.data, borderColor: '#34d399', tension: 0.1, fill: false }]
                },
                options: { plugins: { legend: { display: false } } }
            });
            return () => chart.destroy();
        }
    }, [data]);
    return <canvas ref={chartRef}></canvas>;
};


export default GrowthAnalyticsTab;
