import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import BookCardSkeleton from '../components/BookCardSkeleton'; // Use skeleton here too
import { FaArrowLeft } from 'react-icons/fa';
import PageTransition from '../components/PageTransition'; // <--- Import
const ViewAllBooks = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); // 'nearby' or 'recent'
  const category = searchParams.get('category'); // 'Education', etc.

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('All Books');

  useEffect(() => {
    const fetchBooks = async () => {
      let url = 'http://localhost:5000/api/books';
      setLoading(true);

      // 1. Handle "Nearby" - Needs GPS
      if (type === 'nearby') {
         setPageTitle('📍 Books Near You');
         if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const { data } = await axios.get(`${url}?lat=${latitude}&lng=${longitude}`);
                setBooks(data);
                setLoading(false);
            });
            return; // Exit early to wait for GPS
         }
      } 
      
      // 2. Handle Categories
      else if (category) {
         setPageTitle(`${category} Books`);
      } else {
         setPageTitle('Fresh Recommendations');
      }

      try {
        const { data } = await axios.get(url);
        
        let filtered = data;
        // Client-side filtering for category
        if (category) {
            filtered = data.filter(b => b.category === category);
        }
        
        setBooks(filtered);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };

    fetchBooks();
  }, [type, category]);

  return (
    <PageTransition>
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-600 hover:text-black p-2 rounded-full hover:bg-gray-100">
           <FaArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {Array(8).fill(0).map((_, i) => <BookCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {books.length > 0 ? (
             books.map(book => <BookCard key={book._id} book={book} />)
          ) : (
             <p>No books found.</p>
          )}
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default ViewAllBooks;