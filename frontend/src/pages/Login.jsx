 import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import axios from 'axios';
import api from '../api/axios'; // Import our new custom interceptor
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import toast from 'react-hot-toast'; // <--- 1. Import Toast
import PageTransition from '../components/PageTransition'; // <--- Import
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  //const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Start Loading Toast
    const toastId = toast.loading('Verifying credentials...');

    try {
//       const res = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password });
      const res = await api.post('/api/users/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      
      // 3. Success Toast (Updates the loading toast)
      toast.success(`Welcome back, ${res.data.name}! 🚀`, { id: toastId });
      
      // 4. Short delay so user sees the success message before reload
      setTimeout(() => {
        window.location.href = '/'; 
      }, 1000);

    } catch (err) {
      // 5. Error Toast
      toast.error(err.response?.data?.message || 'Invalid Email or Password', { id: toastId });
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 transform transition-all hover:scale-[1.01]">
        
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent sm:text-sm transition-all"
                placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent sm:text-sm transition-all"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-yellow-600 hover:text-yellow-500">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <FaSignInAlt className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition" />
            </span>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          New to ReBook?{' '}
          <Link to="/register" className="font-bold text-yellow-600 hover:text-yellow-500 transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
    </PageTransition>
  );
};

export default Login;