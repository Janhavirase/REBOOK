import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  
  // 1. Get user object
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
    closeSidebar();
  };

  return (
    <>
      {/* --- A. DARK OVERLAY (BACKDROP) --- */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-70 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeSidebar} 
      ></div>

      {/* --- B. SLIDING SIDEBAR PANEL --- */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header (User Greeting) */}
        <div className="bg-gray-800 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">👤</div>
             
             {/* DYNAMIC NAME DISPLAY */}
             <h2 className="text-lg font-bold truncate max-w-[150px]">
               {user ? `Hello, ${user.name}` : 'Hello, Sign in'}
             </h2>
             
          </div>
          <button onClick={closeSidebar} className="text-2xl font-bold hover:text-red-400">&times;</button>
        </div>

        {/* Content Links */}
        <div className="py-4 overflow-y-auto h-full pb-20">
          
          <div className="px-6 pb-2 text-lg font-bold text-gray-800 border-b mb-2">My Account</div>
          
          <ul className="space-y-1">
            <li>
              <Link to="/" onClick={closeSidebar} className="block px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-black">
                🏠 Home Marketplace
              </Link>
            </li>

            {/* --- C. USER LINKS --- */}
            {user && (
              <>
                <li>
                  <Link to="/my-listings" onClick={closeSidebar} className="block px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-black font-semibold text-yellow-700">
                    📚 My Listings
                  </Link>
                </li>
                <li>
                  <Link to="/sell" onClick={closeSidebar} className="block px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-black">
                    💰 Sell a Book
                  </Link>
                </li>
              </>
            )}
          </ul>

          <hr className="my-4 border-gray-200" />

          {/* --- D. HELP & ADMIN SECTION --- */}
          <div className="px-6 pb-2 text-lg font-bold text-gray-800">Help & Settings</div>
          <ul className="space-y-1">
            
            {/* 1. Contact Us (Everyone) */}
            <li>
              <Link to="/contact" onClick={closeSidebar} className="block px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-black">
                📞 Contact Us
              </Link>
            </li>

            {/* 2. Admin Dashboard (Only Admin) */}
            {user && user.isAdmin && (
                <li>
                    <Link to="/admin" onClick={closeSidebar} className="block px-6 py-3 text-red-600 font-bold hover:bg-red-50">
                        🛡️ Admin Dashboard
                    </Link>
                </li>
            )}

            {/* 3. Sign In / Out */}
             {user ? (
              <li>
                <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-red-600 hover:bg-red-50 font-bold">
                  Sign Out
                </button>
              </li>
            ) : (
              <li>
                <Link to="/login" onClick={closeSidebar} className="block px-6 py-3 text-gray-600 hover:bg-gray-100">
                  Sign In
                </Link>
              </li>
            )}
          </ul>

        </div>
      </div>
    </>
  );
};

export default Sidebar;