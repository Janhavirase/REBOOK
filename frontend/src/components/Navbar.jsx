import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 1. Import FaBars for the hamburger menu
import { FaSearch, FaShoppingCart, FaBars } from 'react-icons/fa';

// 2. Accept the 'toggleSidebar' prop from App.js
const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/login'; 
  };

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* --- NEW: HAMBURGER MENU BUTTON --- */}
        {/* This triggers the Amazon-style sidebar */}
        <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="mr-4 text-white hover:text-yellow-400 focus:outline-none"
        >
          <FaBars size={24} />
        </button>
        {/* ---------------------------------- */}

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-yellow-400 mr-6 cursor-pointer flex items-center">
          ReBook<span className="text-white text-sm font-normal ml-1">.in</span>
        </Link>

     </div>

        {/* Right Side Links */}
        <div className="flex items-center space-x-6 ml-6">
          
          {/* Sell Button */}
          <Link to="/sell">
            <button className="bg-white text-gray-900 px-3 py-1 rounded font-bold hover:bg-gray-200 transition">
              + Sell
            </button>
          </Link>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-300">Hello,</span>
                    <span className="font-bold text-sm text-yellow-400 capitalize">{user.name}</span>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 font-bold"
                >
                    Logout
                </button>
            </div>
          ) : (
            <Link to="/login">
              <div className="flex flex-col text-xs cursor-pointer hover:underline text-white">
                <span className="text-gray-300">Hello, Sign in</span>
                <span className="font-bold text-sm">Account</span>
              </div>
            </Link>
          )}

         {/* --- CLICKABLE SHOPPING CART --- */}
          <Link to="/cart">
            <div className="relative cursor-pointer hover:text-yellow-400 transition">
                <FaShoppingCart size={24} />
                {/* Optional: You can display '!' or count here */}
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-1 rounded-full">
                !
                </span>
            </div>
          </Link>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;