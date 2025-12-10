import React from 'react';

const BookCardSkeleton = () => {
  return (
    // 'animate-pulse' makes the whole card shimmer automatically
    <div className="bg-white border border-gray-200 rounded-lg shadow p-4 flex flex-col h-full animate-pulse">
      
      {/* 1. Fake Image Area (Gray Box) */}
      <div className="h-48 bg-gray-300 rounded-md mb-4 w-full"></div>

      {/* 2. Fake Content Area */}
      <div className="flex-grow">
        
        {/* Fake Location Tag */}
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>

        {/* Fake Title (2 lines) */}
        <div className="h-5 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-2/3 mb-3"></div>

        {/* Fake Author */}
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        
        {/* Fake Badge */}
        <div className="h-6 bg-gray-200 rounded-full w-16 mb-2"></div>
      </div>

      {/* 3. Fake Price & Button */}
      <div className="mt-4 flex items-center justify-between border-t pt-2 border-gray-100">
        <div className="h-6 bg-gray-300 rounded w-20"></div> {/* Price */}
        <div className="h-8 bg-gray-300 rounded-full w-20"></div> {/* Button */}
      </div>
    </div>
  );
};

export default BookCardSkeleton;