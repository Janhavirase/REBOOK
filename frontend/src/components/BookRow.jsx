import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import BookCard from './BookCard';
import BookCardSkeleton from './BookCardSkeleton';

const BookRow = ({ title, books, link, loading }) => {
  
  // 1. Logic: Create dummy array if loading, else use real books
  const displayItems = loading 
    ? [1, 2, 3, 4] 
    : books.slice(0, 4);

  // If not loading and no books, hide section
  if (!loading && books.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        
        {/* Only show arrow if data is loaded */}
        {!loading && (
            <Link to={link} className="text-blue-600 hover:text-blue-800">
            <FaArrowRight size={20} />
            </Link>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* FIX: Use 'displayItems' here */}
        {displayItems.map((item, index) => (
           
           // FIX: Conditionally render Skeleton or Real Card
           loading ? (
             <BookCardSkeleton key={index} />
           ) : (
             <BookCard key={item._id} book={item} />
           )

        ))}
      </div>
    </div>
  );
};

export default BookRow;