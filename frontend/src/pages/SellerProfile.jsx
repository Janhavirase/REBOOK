import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookCard from '../components/BookCard';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import PageTransition from '../components/PageTransition'; // <--- Import
const SellerProfile = () => {
  const { id } = useParams(); // Seller ID
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/users/profile/${id}`);
        setProfile(data.user);
        setBooks(data.books);
        setReviews(data.reviews);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Login to write a review");

    try {
        await axios.post(`http://localhost:5000/api/users/${id}/reviews`, 
            { rating, comment },
            { headers: { Authorization: `Bearer ${currentUser.token}` } }
        );
        alert("Review Submitted!");
        window.location.reload(); 
    } catch (error) {
        alert(error.response?.data?.message || "Error submitting review");
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1)
    : "New";

  if (loading) return <div className="text-center mt-20">Loading Profile...</div>;
  if (!profile) return <div className="text-center mt-20">User not found</div>;

  return (
    <PageTransition>
    <div className="container mx-auto p-4 max-w-5xl">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center gap-6">
         <div className="bg-gray-100 p-4 rounded-full">
            <FaUserCircle size={80} className="text-gray-400" />
         </div>
         <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800 capitalize">{profile.name}</h1>
            <p className="text-gray-500">Member since {new Date(profile.createdAt).getFullYear()}</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <FaStar className="text-yellow-400" size={20}/>
                <span className="text-xl font-bold text-gray-800">{avgRating}</span>
                <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>
         </div>
      </div>

      {/* BOOKS */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Books for Sale</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
         {books.length === 0 ? <p className="text-gray-500">No active listings.</p> : (
             books.map(book => <BookCard key={book._id} book={book} />)
         )}
      </div>

      {/* REVIEWS */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Reviews</h2>
      <div className="grid gap-4 mb-8">
         {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
         {reviews.map(review => (
             <div key={review._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <div className="flex justify-between mb-2">
                    <strong className="capitalize">{review.reviewer.name}</strong>
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                        ))}
                    </div>
                 </div>
                 <p className="text-gray-600">{review.comment}</p>
             </div>
         ))}
      </div>

      {/* REVIEW FORM */}
      {currentUser && currentUser._id !== id && (
          <form onSubmit={submitReview} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-4">Write a Review</h3>
              <select value={rating} onChange={(e) => setRating(e.target.value)} className="p-2 border rounded mb-4 block">
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Terrible</option>
              </select>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} required className="w-full p-3 border rounded h-24 mb-4" placeholder="Describe your experience..."></textarea>
              <button className="bg-yellow-400 text-black px-6 py-2 rounded font-bold hover:bg-yellow-500">Submit Review</button>
          </form>
      )}
    </div>
    </PageTransition>
  );
};

export default SellerProfile;