import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaTrash, FaWhatsapp } from 'react-icons/fa';
import PageTransition from '../components/PageTransition'; // <--- Import
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Cart Items
  useEffect(() => {
    const fetchCart = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) return;
      const token = JSON.parse(userInfo).token;

      try {
        const { data } = await axios.get('https://rebook-unyc.onrender.com/api/users/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCartItems(data);
      } catch (error) {
        console.error("Error fetching cart", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // 2. Remove Item Function
  const removeItem = async (bookId) => {
      const userInfo = localStorage.getItem('userInfo');
      const token = JSON.parse(userInfo).token;

      try {
          await axios.delete(`https://rebook-unyc.onrender.com/api/users/cart/${bookId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          // Update UI instantly
          setCartItems(cartItems.filter(item => item._id !== bookId));
      } catch (error) {
          alert("Error removing item");
      }
  };

  // 3. Contact Seller Function
  const contactSeller = (book) => {
    if (book.seller?.phone) {
        const msg = `Hi, I saw your book "${book.title}" in my ReBook cart. Is it available?`;
        window.open(`https://wa.me/${book.seller.phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  if (loading) return <div className="text-center mt-20">Loading Cart...</div>;

  return (
      <PageTransition>
    <div className="container mx-auto p-4 max-w-4xl mt-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          🛒 Your Shopping Cart 
          <span className="text-lg font-normal text-gray-500">({cartItems.length} items)</span>
      </h1>

      {cartItems.length === 0 ? (
          <div className="text-center bg-white p-10 rounded shadow">
              <p className="text-xl text-gray-500 mb-4">Your cart is empty.</p>
              <Link to="/" className="bg-yellow-400 px-6 py-2 rounded font-bold hover:bg-yellow-500">
                  Browse Books
              </Link>
          </div>
      ) : (
          <div className="grid gap-4">
              {cartItems.map(item => (
                  <div key={item._id} className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row items-center gap-4">
                      {/* Image */}
                      <img src={item.image?.url} alt={item.title} className="w-24 h-32 object-contain bg-gray-50 rounded" />
                      
                      {/* Details */}
                      <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                          <p className="text-gray-500 text-sm">by {item.author}</p>
                          <p className="text-green-600 font-bold text-lg mt-1">₹{item.price}</p>
                          <p className="text-xs text-gray-400 mt-1">Seller: {item.seller?.name}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                          <button 
                             onClick={() => contactSeller(item)}
                             className="bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 hover:bg-green-600"
                          >
                             <FaWhatsapp /> Buy Now
                          </button>
                          
                          <button 
                             onClick={() => removeItem(item._id)}
                             className="bg-red-100 text-red-500 px-4 py-2 rounded font-bold flex items-center justify-center gap-2 hover:bg-red-200 text-sm"
                          >
                             <FaTrash /> Remove
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
    </PageTransition>
  );
};

export default Cart;