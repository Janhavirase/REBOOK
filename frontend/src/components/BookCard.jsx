import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <--- 1. Added useNavigate
import axios from 'axios';
import { FaShoppingCart, FaMapMarkerAlt, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast'; 

// Helper function to format distance
const formatDistance = (meters) => {
  if (meters === undefined || meters === null) return null;
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
};

const BookCard = ({ book }) => {
  const navigate = useNavigate(); // <--- 2. Initialize Hook

  const handleAddToCart = async (e) => {
    // 1. Stop the click from triggering the <Link> parent
    e.preventDefault(); 
    e.stopPropagation(); 
    
    const userInfoString = localStorage.getItem('userInfo');
    
    // --- 3. LOGIN CHECK LOGIC (NEW) ---
    if (!userInfoString) {
        toast.error("Please Login to shop! 🛒");
        navigate('/login'); // <--- Redirects to Login
        return;
    }
    // ----------------------------------
    
    const userInfo = JSON.parse(userInfoString);

    // 4. Smart Validation (Prevent Buying Own Book)
    const sellerId = typeof book.seller === 'object' ? book.seller?._id : book.seller;
    
    if (sellerId === userInfo._id) {
        toast.error("You cannot buy your own book! 😅");
        return;
    }

    // Start Loading Toast
    const toastId = toast.loading("Adding to cart...");

    try {
        await axios.post(`http://localhost:5000/api/users/cart/${book._id}`, {}, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        
        toast.success("Added to Cart! 🛍️", { id: toastId });

    } catch (error) {
        const msg = error.response?.data?.message || "Item is already in your cart";
        toast.error(msg, { id: toastId, icon: '⚠️' });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col h-full relative group">
      
      {/* Image Area */}
      <Link to={`/book/${book._id}`}>
        <div className="h-48 flex justify-center items-center bg-gray-50 rounded mb-4 overflow-hidden relative cursor-pointer">
          <img 
            src={book.image?.url} 
            alt={book.title} 
            className="h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300" 
          />
        </div>
      </Link>

      {/* Content Area */}
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-center text-xs text-gray-500">
               <FaMapMarkerAlt className="mr-1 text-red-500" />
               <span className="capitalize font-medium truncate max-w-[100px]">
                 {book.city || 'Unknown'}
               </span>
           </div>

           {book.distance !== undefined && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap ml-2">
                  {formatDistance(book.distance)}
              </span>
           )}
        </div>

        <Link to={`/book/${book._id}`}>
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 hover:text-yellow-600 transition-colors cursor-pointer leading-tight mb-1">
            {book.title}
          </h3>
        </Link>

        <p className="text-gray-500 text-sm mb-3">by {book.author}</p>
        
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            book.condition === 'New' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
            {book.condition}
        </span>
      </div>

      {/* Price & Actions */}
      <div className="mt-4 flex items-center justify-between border-t pt-3 gap-2">
        <span className="text-xl font-extrabold text-gray-900">₹{book.price}</span>
        
        <div className="flex gap-2">
            <Link to={`/book/${book._id}`}>
            <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1">
                <FaEye size={14}/>
            </button>
            </Link>

            {/* Button Theme Preserved (Yellow) */}
            <button 
                onClick={handleAddToCart}
                className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-yellow-500 transition shadow-sm active:scale-95 transform"
            >
                <FaShoppingCart /> Add
            </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;