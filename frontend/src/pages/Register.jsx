import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUserPlus } from 'react-icons/fa';
import toast from 'react-hot-toast'; // <--- 1. Import Toast
import PageTransition from '../components/PageTransition'; // <--- Import
const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '' 
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Start Loading Toast
    const toastId = toast.loading('Creating your account...');

    try {
      // --- Combine +91 with the user's number ---
      const payload = {
          ...formData,
          phone: "+91" + formData.phone 
      };

      const res = await axios.post('http://localhost:5000/api/users/register', payload);
      
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      
      // 3. Success Toast (Updates the loading toast)
      toast.success('Account Created Successfully! 🎉', { id: toastId });
      
      // 4. Short delay so user sees the success message before reload
      setTimeout(() => {
          window.location.href = '/'; 
      }, 1500);

    } catch (err) {
      console.error(err);
      // 5. Error Toast
      toast.error(err.response?.data?.message || 'Registration Failed. Email may be taken.', { id: toastId });
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 transform transition-all hover:scale-[1.01]">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the community to buy & sell books
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          
          {/* Name Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaUser />
            </div>
            <input
              type="text"
              name="name"
              required
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              placeholder="Full Name"
              onChange={handleChange}
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaEnvelope />
            </div>
            <input
              type="email"
              name="email"
              required
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              placeholder="Email Address"
              onChange={handleChange}
            />
          </div>

          {/* --- PHONE INPUT WITH +91 PREFIX --- */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaPhone />
              {/* This span acts as the visual +91 prefix */}
              <span className="ml-2 text-gray-600 font-bold border-l border-gray-300 pl-2 text-sm">+91</span>
            </div>
            <input
              type="tel"
              name="phone"
              required
              maxLength="10" // Limit to 10 digits
              className="appearance-none rounded-lg block w-full pl-24 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              placeholder="98765 43210"
              onChange={handleChange}
            />
          </div>
          <p className="text-xs text-gray-500 ml-1">Buyers will use this number to contact you.</p>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FaLock />
            </div>
            <input
              type="password"
              name="password"
              required
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              placeholder="Create Password"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <FaUserPlus className="h-5 w-5 text-gray-800 group-hover:text-black transition" />
            </span>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-yellow-600 hover:text-yellow-500 transition">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
    </PageTransition>
  );
};

export default Register;