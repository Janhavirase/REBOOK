import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // <--- Added useNavigate
import axios from 'axios';
import { FaMapMarkerAlt, FaUser, FaWhatsapp, FaArrowLeft, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast'; // <--- Added Toast for feedback
import BookCard from '../components/BookCard'; 
import PageTransition from '../components/PageTransition'; 

const BookDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate(); // <--- Initialize Hook
  const [book, setBook] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Fetch Book Data & Recommendations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // A. Get Main Book Details
        const { data: mainBook } = await axios.get(`http://localhost:5000/api/books/${id}`);
        setBook(mainBook);

        // B. Get Similar Books (If category exists)
        if (mainBook.category) {
            try {
                const { data: related } = await axios.get(
                    `http://localhost:5000/api/books/similar/${id}/${mainBook.category}`
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

  // --- UPDATED BUY/CHAT LOGIC ---
  const handleBuy = () => {
    // 1. Check if User is Logged In
    const userInfo = localStorage.getItem('userInfo');

    if (!userInfo) {
        // 2. If Not Logged In -> Redirect
        toast.error("Please Login to contact seller! 🔒");
        navigate('/login');
        return;
    }

    // 3. If Logged In -> Proceed with WhatsApp/Email
    if (book.seller?.phone) {
      const message = `Hi ${book.seller.name}, I am interested in buying your book "${book.title}" listed on ReBook for ₹${book.price}. Is it available?`;
      window.open(`https://wa.me/${book.seller.phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const subject = `Interested in: ${book.title}`;
      window.location.href = `mailto:${book.seller?.email}?subject=${subject}`;
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-semibold">Loading details...</div>;
  if (!book) return <div className="text-center mt-20 text-red-500 font-bold">Book not found!</div>;

  return (
    <PageTransition>
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      
      {/* Back Navigation */}
      <Link to="/" className="inline-flex items-center text-gray-600 hover:text-yellow-600 mb-6 font-medium transition">
        <FaArrowLeft className="mr-2" /> Back to Marketplace
      </Link>

      {/* --- MAIN PRODUCT CARD --- */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100 mb-12">
        
        {/* LEFT: Image */}
        <div className="md:w-1/2 bg-gray-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
          <img 
            src={book.image?.url} 
            alt={book.title} 
            className="max-h-[500px] w-full object-contain drop-shadow-lg"
          />
        </div>

        {/* RIGHT: Details */}
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
                   {/* 1. Seller Name is now a Clickable Link */}
                   <p className="text-lg font-bold capitalize text-gray-900">
                     <Link 
                       to={`/profile/${book.seller?._id}`} 
                       className="hover:text-blue-600 hover:underline transition-colors"
                     >
                       {book.seller?.name}
                     </Link>
                   </p>
                   
                   {/* 2. Subtext link to encourage clicking */}
                   <Link to={`/profile/${book.seller?._id}`} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                     View Profile & Reviews →
                   </Link>
                </div>
                
                <div className="text-right">
                   {book.seller?.phone ? (
                      <p className="text-gray-800 font-mono font-bold flex items-center gap-2">
                        <FaPhone className="text-green-600"/> {book.seller.phone}
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
          </div>
        </div>
      </div>

      {/* --- 3. SIMILAR BOOKS SECTION --- */}
      {similarBooks.length > 0 && (
        <div className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You might also like</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarBooks.map((relatedBook) => (
                    // Reuse the BookCard component for consistent UI
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