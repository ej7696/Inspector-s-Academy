import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import api from '../services/apiService';
import ConfirmDialog from './ConfirmDialog';

const AnnouncementManager: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [error, setError] = useState('');
    const [pendingDelete, setPendingDelete] = useState<Announcement | null>(null);

    const fetchAnnouncements = async () => {
        try {
            const data = await api.getAnnouncements();
            setAnnouncements(data.sort((a, b) => b.createdAt - a.createdAt));
        } catch (err) {
            setError('Failed to load announcements.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.trim()) return;
        try {
            await api.addAnnouncement({ message: newAnnouncement, isActive: true });
            setNewAnnouncement('');
            fetchAnnouncements();
        } catch (err: any) {
            setError(err.message || 'Failed to add announcement.');
        }
    };
    
    const handleToggle = async (ann: Announcement) => {
        try {
            await api.updateAnnouncement(ann.id, { isActive: !ann.isActive });
            fetchAnnouncements();
        } catch(err: any) {
            setError(err.message || 'Failed to toggle status.');
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await api.deleteAnnouncement(pendingDelete.id);
            setPendingDelete(null);
            fetchAnnouncements();
        } catch (err: any) {
            setError(err.message || 'Failed to delete announcement.');
            setPendingDelete(null);
        }
    };

    if (isLoading) return <p>Loading announcements...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Announcements</h2>
            
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newAnnouncement}
                    onChange={e => setNewAnnouncement(e.target.value)}
                    placeholder="Enter new announcement message..."
                    className="flex-grow p-2 border rounded-md"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Add
                </button>
            </form>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <ul className="divide-y divide-gray-200">
                {announcements.map(ann => (
                    <li key={ann.id} className="py-3 flex flex-col sm:flex-row justify-between items-start gap-4">
                       <div>
                            <p className="text-gray-800">{ann.message}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ann.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {ann.isActive ? 'Visible' : 'Hidden'}
                            </span>
                       </div>
                        <div className="flex gap-2 flex-shrink-0">
                             <button onClick={() => handleToggle(ann)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md">{ann.isActive ? 'Hide' : 'Show'}</button>
                             <button onClick={() => setPendingDelete(ann)} className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {pendingDelete && (
                <ConfirmDialog
                    open={true}
                    title="Delete Announcement?"
                    message="Are you sure you want to permanently delete this announcement? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
        </div>
    );
};

export default AnnouncementManager;
