import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition'; // <--- Import
const editBook = () => {
  const { id } = useParams(); // Get book ID from URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    condition: '',
    description: '',
    category: '',
    city: ''
  });
  
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(''); // To show existing preview

  // 1. Fetch existing book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/books`);
        // Note: Ideally you should have a 'getSingleBook' API, but filtering locally works for now
        const book = data.find((b) => b._id === id);
        
        if (book) {
            setFormData({
                title: book.title,
                author: book.author,
                price: book.price,
                condition: book.condition,
                description: book.description,
                category: book.category,
                city: book.city
            });
            setCurrentImage(book.image?.url);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const userInfo = localStorage.getItem('userInfo');
    const token = JSON.parse(userInfo).token;

    const data = new FormData();
    // Append all text fields
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Only append image if user selected a new one
    if (image) {
        data.append('image', image);
    }

    try {
      await axios.put(`http://localhost:5000/api/books/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      alert('Book Updated Successfully!');
      navigate('/my-listings');
    } catch (err) {
      alert('Error updating book');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading details...</div>;

  return (
      <PageTransition>
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6">Edit Listing</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Author */}
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Title" required className="w-full p-3 border rounded" />
          <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Author" required className="w-full p-3 border rounded" />
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required className="w-full p-3 border rounded" />
          <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border rounded">
            <option value="Education">Education</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
          </select>
        </div>

        {/* City & Condition */}
        <div className="grid grid-cols-2 gap-4">
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" required className="w-full p-3 border rounded" />
            <select name="condition" value={formData.condition} onChange={handleChange} className="w-full p-3 border rounded">
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
            </select>
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full p-3 border rounded"></textarea>

        {/* Image Preview & Upload */}
        <div className="flex items-center gap-4">
            {currentImage && <img src={currentImage} alt="Current" className="w-20 h-20 object-cover rounded border" />}
            <input type="file" onChange={handleFileChange} accept="image/*" />
        </div>

        <button type="submit" disabled={uploading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
          {uploading ? 'Updating...' : 'Update Listing'}
        </button>
      </form>
    </div>
    </PageTransition>
  );
};

export default editBook;