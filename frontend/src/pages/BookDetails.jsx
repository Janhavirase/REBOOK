import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaMapMarkerAlt, FaUser, FaWhatsapp, FaArrowLeft, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast';
import BookCard from '../components/BookCard'; 
import PageTransition from '../components/PageTransition'; 

const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  
  // 🚨 NEW STATE: We need to store the seller's fetched profile data separately
  const [sellerData, setSellerData] = useState(null); 
  const [similarBooks, setSimilarBooks] = useState([]); 
  const [loading, setLoading] = useState(true);
  //const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE_URL = 'https://rebook-api-gateway.onrender.com';
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // A. Get Main Book Details (From Catalog Service)
        const { data: mainBook } = await axios.get(`${API_BASE_URL}/api/books/${id}`);
        setBook(mainBook);

        // B. THE MICROSERVICE JOIN: Fetch the Seller Details from the Auth Service
        // mainBook.seller is now just a string ID from the Catalog Service!
        const sellerId = mainBook.seller._id || mainBook.seller; 
        
        if (sellerId) {
            try {
                const { data: sellerInfo } = await axios.get(`${API_BASE_URL}/api/users/profile/${sellerId}`);
                setSellerData(sellerInfo);
            } catch (err) {
                console.error("Error fetching seller details", err);
            }
        }

        // C. Get Similar Books 
        if (mainBook.category) {
            try {
                const { data: related } = await axios.get(
                    `${API_BASE_URL}/api/books/similar/${id}/${mainBook.category}`
                );
                setSimilarBooks(related);
            } catch (err) {
                console.error("Error fetching similar books", err);
            }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book details", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBuy = () => {
    const userInfo = localStorage.getItem('userInfo');

    if (!userInfo) {
        toast.error("Please Login to contact seller! 🔒");
        navigate('/login');
        return;
    }

    // 🚨 UPDATED: Use the new sellerData state, not book.seller
    if (sellerData?.phone) {
      const message = `Hi ${sellerData.name}, I am interested in buying your book "${book.title}" listed on ReBook for ₹${book.price}. Is it available?`;
      window.open(`https://wa.me/${sellerData.phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const subject = `Interested in: ${book.title}`;
      window.location.href = `mailto:${sellerData?.email}?subject=${subject}`;
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-semibold">Loading details...</div>;
  if (!book) return <div className="text-center mt-20 text-red-500 font-bold">Book not found!</div>;

  // We determine the ID just in case we need it for links
  const sellerId = book.seller._id || book.seller;
const handleRazorpayBuy = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return toast.error("Please login to buy books.");

    const toastId = toast.loading("Connecting to Razorpay...");

    try {
        // 1. Tell backend to create an order
        const { data: order } = await axios.post(`${API_BASE_URL}/api/payment/create-order`, {
            amount: book.price,
            bookId: book._id,
            buyerId: userInfo._id
        });

        toast.dismiss(toastId);

        // 2. Open Razorpay Checkout Modal
        const options = {
            key:import.meta.env.VITE_RAZORPAY_KEY_ID, // Add your test key here
            amount: order.amount,
            currency: order.currency,
            name: "ReBook Marketplace",
            description: `Purchase: ${book.title}`,
            order_id: order.id,
            handler: function (response) {
                // Razorpay handles the success automatically via webhook on the backend!
                toast.success("Payment Successful! The seller will be notified.");
                navigate('/');
            },
            prefill: {
                name: userInfo.name,
                email: userInfo.email,
                contact: userInfo.phone
            },
            theme: { color: "#FBBF24" } // Yellow to match ReBook theme
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error(error);
        toast.error("Could not initiate payment.", { id: toastId });
    }
  };
  return (
    <PageTransition>
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      
      <Link to="/" className="inline-flex items-center text-gray-600 hover:text-yellow-600 mb-6 font-medium transition">
        <FaArrowLeft className="mr-2" /> Back to Homennnnnnnn
      </Link>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100 mb-12">
        
        <div className="md:w-1/2 bg-gray-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
          <img 
            src={book.image?.url} 
            alt={book.title} 
            className="max-h-[500px] w-full object-contain drop-shadow-lg"
          />
        </div>

        <div className="md:w-1/2 p-8 flex flex-col">
          <div className="mb-4">
              <div className="flex justify-between items-start">
                 <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{book.title}</h1>
                 <span className="text-2xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                   ₹{book.price}
                 </span>
              </div>
              <p className="text-lg text-gray-500 mt-1">by <span className="text-gray-800 font-semibold">{book.author}</span></p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
              🏷️ {book.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
               book.condition === 'New' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
                ✨ {book.condition}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold flex items-center">
              <FaMapMarkerAlt className="mr-1 text-red-500" /> {book.city}
            </span>
          </div>

          <hr className="border-gray-200 mb-6" />

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {book.description}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-auto">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FaUser className="text-gray-500"/> Seller Details
             </h3>
             <div className="flex items-center justify-between">
                <div>
                   {/* 🚨 UPDATED: Display fetched sellerData name and ID */}
                   <p className="text-lg font-bold capitalize text-gray-900">
                     <Link 
                       to={`/profile/${sellerId}`} 
                       className="hover:text-blue-600 hover:underline transition-colors"
                     >
                       {sellerData ? sellerData.name : 'Loading...'}
                     </Link>
                   </p>
                   
                   <Link to={`/profile/${sellerId}`} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                     View Profile & Reviews →
                   </Link>
                </div>
                
                <div className="text-right">
                   {/* 🚨 UPDATED: Display fetched sellerData phone */}
                   {sellerData?.phone ? (
                      <p className="text-gray-800 font-mono font-bold flex items-center gap-2">
                        <FaPhone className="text-green-600"/> {sellerData.phone}
                      </p>
                   ) : (
                      <p className="text-gray-400 text-sm italic">Phone hidden</p>
                   )}
                </div>
             </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button 
              onClick={handleBuy}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FaWhatsapp size={20} /> Chat / Buy Now
            </button>
            <button 
      onClick={handleRazorpayBuy}
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg"
  >
      💳 Buy Securely
  </button>
          </div>
        </div>
      </div>

      {similarBooks.length > 0 && (
        <div className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You might also like</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarBooks.map((relatedBook) => (
                    <BookCard key={relatedBook._id} book={relatedBook} />
                ))}
            </div>
        </div>
      )}

    </div>
    </PageTransition>
  );
};

export default BookDetails;