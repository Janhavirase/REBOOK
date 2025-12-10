import React from 'react';
import { Link } from 'react-router-dom';

// 1. Destructure 'category' (matching the prop name in Home.jsx)
const CategoryBlock = ({ title, image, category }) => {
  return (
    <Link 
      // 2. Fix the URL to point to the View All page with a query param
      to={`/view-all?category=${category}`} 
      className="relative h-40 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition transform hover:-translate-y-1 block group"
    >
      {/* Background Image with Zoom Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      
      {/* Gradient Overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition"></div>

      {/* Centered Text - Made larger and bolder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <h3 className="text-white font-extrabold text-2xl tracking-wide drop-shadow-lg border-b-2 border-transparent group-hover:border-yellow-400 transition-all">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default CategoryBlock;