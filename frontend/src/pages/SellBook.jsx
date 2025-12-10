import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaLocationArrow, FaCloudUploadAlt, FaBook, FaMapMarkerAlt, FaCheckCircle, FaRupeeSign, FaTag, FaCamera } from 'react-icons/fa';
import toast from 'react-hot-toast'; 
import PageTransition from '../components/PageTransition'; 

const SellBook = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '', author: '', price: '', condition: 'Good', description: '', category: 'Education', city: '' 
  });
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if(file) setPreview(URL.createObjectURL(file));
  };

  // --- LOCATION LOGIC ---
  const getLocation = () => {
    setLocationStatus('Locating...');
    const toastId = toast.loading('Triangulating position...');

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLocationStatus('GPS Locked');
          toast.success('Location Locked! 📍', { id: toastId });
        },
        (error) => {
          console.error(error);
          setLocationStatus('Permission Denied');
          toast.error('Location Access Denied', { id: toastId });
        },
        options 
      );
    } else {
      toast.error('GPS not supported', { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
      toast.error("Please login to sell books!");
      navigate('/login');
      setLoading(false);
      return;
    }

    if (!lat || !lng) {
        toast.error("Please click 'Detect Location' first!", { icon: '🗺️' });
        setLoading(false);
        return;
    }

    const toastId = toast.loading('Uploading your book...');
    const token = JSON.parse(userInfo).token;

    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('price', formData.price);
    data.append('condition', formData.condition);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('city', formData.city);
    data.append('latitude', lat);
    data.append('longitude', lng);
    data.append('image', image); 

    try {
      await axios.post('https://rebook-unyc.onrender.com/api/books/sell', data, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
      });

      toast.success('Listing Published! 🚀', { id: toastId });
      
      setTimeout(() => {
          navigate('/'); 
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error('Upload Failed. Try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Professional Header Strip */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-slate-800">
             <span className="text-2xl font-bold tracking-tight">Sell on ReBook</span>
             <span className="text-sm text-slate-500 mt-1 border-l border-gray-300 pl-3">Merchant Console</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header Section - Dark Slate/Blue */}
        <div className="bg-slate-900 p-6 text-white border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <FaBook className="text-blue-400"/> Product Details
            </h2>
            <p className="text-xs text-slate-400 mt-1">Complete the form below to list your item in the marketplace.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* 1. Basic Info Section */}
          <div className="space-y-4">
             <h3 className="text-slate-800 font-bold text-lg border-b border-gray-100 pb-2">1. Vital Info</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name / Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" placeholder="e.g. Physics HC Verma Vol 1" onChange={handleChange} required 
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none text-sm text-gray-900 transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Author / Manufacturer <span className="text-red-500">*</span></label>
                    <input type="text" name="author" placeholder="e.g. HC Verma" onChange={handleChange} required 
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none text-sm text-gray-900 transition-all" />
                </div>
             </div>
          </div>

          {/* 2. Offer Section */}
          <div className="space-y-4 pt-2">
             <h3 className="text-slate-800 font-bold text-lg border-b border-gray-100 pb-2">2. Offer & Pricing</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-sm">
                            <FaRupeeSign />
                        </div>
                        <input type="number" name="price" placeholder="0.00" onChange={handleChange} required 
                          className="w-full p-2.5 pl-8 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none text-sm font-bold text-gray-900" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category" onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer text-sm text-gray-900 shadow-sm hover:bg-gray-100">
                        <option value="Education">Education & Textbooks</option>
                        <option value="Fiction">Fiction & Literature</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Comics">Comics & Graphic Novels</option>
                        <option value="Mystery">Mystery & Thriller</option>
                        <option value="History">History & Politics</option>
                        <option value="Technology">Technology & Engineering</option>
                        <option value="Health">Health & Wellness</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
                    <select name="condition" onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer text-sm text-gray-900 shadow-sm hover:bg-gray-100">
                        <option value="Good">Used - Good</option>
                        <option value="New">New</option>
                        <option value="Like New">Used - Like New</option>
                        <option value="Fair">Used - Fair</option>
                        <option value="Poor">Used - Acceptable</option>
                    </select>
                </div>
             </div>

             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Description</label>
                <textarea name="description" placeholder="Describe the item condition, edition, etc." onChange={handleChange} rows="3"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none resize-none text-sm text-gray-900"></textarea>
             </div>
          </div>

          {/* 3. Images */}
          <div className="space-y-4 pt-2">
             <h3 className="text-slate-800 font-bold text-lg border-b border-gray-100 pb-2">3. Images</h3>
             
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image <span className="text-red-500">*</span></label>
                <div className="flex items-start gap-6">
                    <div className="relative w-40 h-48 border border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-2 rounded-md hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer group">
                        <input type="file" onChange={handleFileChange} accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                        {preview ? (
                             <img src={preview} alt="Preview" className="w-full h-full object-contain"/>
                        ) : (
                             <>
                                <FaCamera className="text-gray-400 text-3xl mb-2 group-hover:text-blue-500 transition-colors"/>
                                <span className="text-xs text-gray-500 group-hover:text-blue-600 font-medium">Upload Image</span>
                             </>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                        <p className="font-semibold text-gray-700">Image Guidelines:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Images must be clear and show the actual item.</li>
                            <li>Pure white backgrounds are preferred.</li>
                            <li>Accepted formats: JPG, PNG.</li>
                        </ul>
                    </div>
                </div>
             </div>
          </div>

          {/* 4. Location (Geotagging) */}
          <div className="space-y-4 pt-2">
             <h3 className="text-slate-800 font-bold text-lg border-b border-gray-100 pb-2">4. Pickup Location</h3>
             
             <div className="bg-gray-50 p-4 border border-gray-200 rounded-md flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                       <label className="block text-sm font-semibold text-gray-700 mb-1">City / Area <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         name="city" 
                         placeholder="Enter City Name (e.g. Mumbai)" 
                         onChange={handleChange} 
                         required 
                         className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none text-sm text-gray-900" 
                       />
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={getLocation}
                    className={`px-4 py-2.5 rounded-md font-medium text-sm border shadow-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                        locationStatus === 'GPS Locked' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-white border-gray-300 text-slate-700 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    {locationStatus === 'GPS Locked' ? <FaCheckCircle /> : <FaLocationArrow />}
                    {locationStatus === 'GPS Locked' ? 'GPS Locked' : 'Detect Location'}
                  </button>
             </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-6 border-t border-gray-100">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <p className="text-xs text-gray-500">By clicking "Publish Listing", you agree to ReBook's Seller Terms.</p>
                 <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full md:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200 text-sm flex items-center justify-center gap-2"
                 >
                    {loading ? 'Processing...' : 'Publish Listing'}
                 </button>
             </div>
          </div>

        </form>
      </div>
    </div>
    </PageTransition>
  );
};

export default SellBook;