import React, { useState } from 'react';
import { User } from '../types';
import api from '../services/apiService';
import Logo from './Logo';

interface Props {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setIsLoading(true);
    setError('');
    try {
      const user = await api.login(demoEmail, demoPass);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Demo account not found.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const user = await api.login(email, password);
        onLoginSuccess(user);
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  // SVG Icons
  const EmailIcon = () => ( <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg> );
  const PasswordIcon = () => ( <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> );
  const Spinner = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl lg:grid lg:grid-cols-2 rounded-xl shadow-2xl overflow-hidden bg-white">
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#1E3A8A] to-[#2c5282] text-center">
                <Logo className="h-40 w-auto" />
                <h2 className="text-3xl font-bold text-white mt-8" style={{ fontFamily: 'Montserrat, sans-serif' }}> Unlock Your Expertise </h2>
                <p className="text-blue-200 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}> Professional practice for API, ASME, and AWS certifications. </p>
            </div>
            <div className="p-8 sm:p-12 flex flex-col justify-center animate-fade-in-up">
                <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: 'Montserrat, sans-serif' }}> Welcome Back </h1>
                <p className="text-gray-500 mt-2 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}> Login to access your mock exams. </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700" htmlFor="email" style={{ fontFamily: 'Poppins, sans-serif' }}> Email Address </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"> <EmailIcon /> </span>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700" htmlFor="password" style={{ fontFamily: 'Poppins, sans-serif' }}> Password </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"> <PasswordIcon /> </span>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition" required />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center bg-[#1E3A8A] text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#2c5282] transition duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {isLoading ? <Spinner /> : 'Login'}
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Explore the Platform</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button onClick={() => handleDemoLogin('admin@test.com', 'admin123')} className="flex-1 text-xs text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Log in as Admin</button>
                        <button onClick={() => handleDemoLogin('subadmin@test.com', 'subadmin123')} className="flex-1 text-xs text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Log in as Subadmin</button>
                        <button onClick={() => handleDemoLogin('cadet@test.com', 'password123')} className="flex-1 text-xs text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Log in as User</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;