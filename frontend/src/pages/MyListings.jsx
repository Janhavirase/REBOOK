import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition'; // <--- Import
const MyListings = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the user's books on load
  useEffect(() => {
    const fetchMyBooks = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) return;

      const token = JSON.parse(userInfo).token;

      try {
        const { data } = await axios.get('http://localhost:5000/api/books/my-books', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks(data);
      } catch (error) {
        console.error("Error fetching books", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();
  }, []);

  // 2. Handle Delete Logic
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      const userInfo = localStorage.getItem('userInfo');
      const token = JSON.parse(userInfo).token;

      try {
        await axios.delete(`http://localhost:5000/api/books/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Remove the deleted item from the state immediately
        setBooks(books.filter((book) => book._id !== id));
      } catch (error) {
        alert("Error deleting book");
      }
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <PageTransition>
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">My Listings</h2>
      
      {books.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>You haven't listed any books yet.</p>
          <Link to="/sell" className="text-yellow-600 font-bold underline mt-2 block">Sell your first book</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book._id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              {/* Image */}
              <img src={book.image?.url || book.image} alt={book.title} className="w-full h-48 object-cover" />
              
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 truncate">{book.title}</h3>
                <p className="text-gray-600 text-sm">{book.author}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xl font-bold text-green-600">₹{book.price}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{book.condition}</span>
                </div>

                {/* --- BUTTON AREA --- */}
                <div className="mt-4 flex gap-2">
                   
                   {/* 1. EDIT BUTTON (Blue) */}
                   <Link 
                     to={`/edit-book/${book._id}`} 
                     className="flex-1 bg-blue-100 text-blue-600 py-2 rounded text-center hover:bg-blue-200 transition font-semibold text-sm"
                   >
                     Edit
                   </Link>

                   {/* 2. REMOVE BUTTON (Red) */}
                   <button 
                     onClick={() => handleDelete(book._id)}
                     className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200 transition font-semibold text-sm"
                   >
                     Remove
                   </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default MyListings;