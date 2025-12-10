import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Home from './pages/Home';
import SellBook from './pages/SellBook';
import Login from './pages/Login';
import Register from './pages/Register';
import MyListings from './pages/MyListings';
import EditBook from './pages/editBook';
import BookDetails from './pages/BookDetails';
import ViewAllBooks from './pages/ViewAllBooks';
import Cart from './pages/Cart';
import SellerProfile from './pages/SellerProfile';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // Keep this component!
// --- CHILD COMPONENT (Handles Layout & Animations) ---
const AppContent = () => {
  // Now safe to use hooks because this is inside <Router>
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="container mx-auto p-4 flex-grow">
       {/* ANIMATION WRAPPER */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          {/* --- PUBLIC ROUTES (Window Shopping) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route path="/view-all" element={<ViewAllBooks />} />
          <Route path="/profile/:id" element={<SellerProfile />} />
          <Route path="/contact" element={<Contact />} />

          {/* --- PROTECTED ROUTES (Must Login) --- */}
          
          {/* 1. Sell Page: Cannot sell without an account */}
          <Route 
            path="/sell" 
            element={
              <ProtectedRoute>
                <SellBook />
              </ProtectedRoute>
            } 
          />

          {/* 2. My Listings: Personal user data */}
          <Route 
            path="/my-listings" 
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            } 
          />

          {/* 3. Edit Book: Editing specific data */}
          <Route 
            path="/edit-book/:id" 
            element={
              <ProtectedRoute>
                <EditBook />
              </ProtectedRoute>
            } 
          />

          {/* 4. Cart: Requires User Session */}
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } 
          />

          {/* 5. Admin: Highest Security */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </AnimatePresence>
        
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <AppContent />
    </Router>
  );
}

export default App;