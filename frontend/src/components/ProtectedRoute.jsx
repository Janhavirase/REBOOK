import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Check if user data exists in local storage
  const userInfo = localStorage.getItem('userInfo');

  // 2. If NO user info found, kick them to the Login page
  // The 'replace' prop prevents them from clicking "Back" to return to the protected page
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // 3. If user is logged in, render the requested page (The "children")
  return children;
};

export default ProtectedRoute;