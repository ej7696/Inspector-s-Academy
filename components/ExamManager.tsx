import React, { useState, useEffect } from 'react';
import { Exam } from '../types';
import api from '../services/apiService';

const ExamManager: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
    const [error, setError] = useState('');

    const fetchExams = async () => {
        try {
            const examData = await api.getExams();
            setExams(examData.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
            setError('Failed to load exams.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExam || !editingExam.name) {
            setError('Exam name is required.');
            return;
        }

        try {
            if (editingExam.id) {
                // Update existing exam
                await api.updateExam(editingExam.id, editingExam);
            } else {
                // Create new exam
                await api.addExam(editingExam as Omit<Exam, 'id'>);
            }
            setEditingExam(null);
            fetchExams(); // Refresh list
        } catch (err: any) {
            setError(err.message || 'Failed to save exam.');
        }
    };

    const handleDelete = async (examId: string) => {
        if (window.confirm('Are you sure you want to delete this exam? This cannot be undone.')) {
            try {
                await api.deleteExam(examId);
                fetchExams();
            } catch (err: any) {
                setError(err.message || 'Failed to delete exam.');
            }
        }
    };
    
    const handleToggleActive = async (exam: Exam) => {
        try {
            await api.updateExam(exam.id, { isActive: !exam.isActive });
            fetchExams();
        } catch (err: any) {
             setError(err.message || 'Failed to update status.');
        }
    };
    
    const startNewExam = () => {
        setEditingExam({
            name: '',
            effectivitySheet: '',
            bodyOfKnowledge: '',
            isActive: true
        });
    };

    if (isLoading) return <p>Loading exams...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Exam Content Management</h2>
                <button onClick={startNewExam} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    + Add New Exam
                </button>
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {editingExam ? (
                <form onSubmit={handleSave} className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-6">
                    <h3 className="text-lg font-semibold">{editingExam.id ? 'Edit Exam' : 'Add New Exam'}</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                        <input
                            type="text"
                            value={editingExam.name || ''}
                            onChange={e => setEditingExam({...editingExam, name: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Effectivity Sheet Content</label>
                        <textarea
                            value={editingExam.effectivitySheet || ''}
                            onChange={e => setEditingExam({...editingExam, effectivitySheet: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-md h-32 font-mono text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Body of Knowledge Content</label>
                        <textarea
                            value={editingExam.bodyOfKnowledge || ''}
                            onChange={e => setEditingExam({...editingExam, bodyOfKnowledge: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-md h-32 font-mono text-xs"
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setEditingExam(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">Save Exam</button>
                    </div>
                </form>
            ) : (
                 <ul className="divide-y divide-gray-200">
                    {exams.map(exam => (
                        <li key={exam.id} className="py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="font-semibold text-gray-900">{exam.name}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${exam.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {exam.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleToggleActive(exam)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md">{exam.isActive ? 'Deactivate' : 'Activate'}</button>
                                <button onClick={() => setEditingExam(exam)} className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded-md">Edit</button>
                                <button onClick={() => handleDelete(exam.id)} className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ExamManager;
