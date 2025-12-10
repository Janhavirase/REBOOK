import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaLocationArrow, FaList, FaMapMarkedAlt, FaTimes } from 'react-icons/fa';
import BookRow from '../components/BookRow';       
import CategoryBlock from '../components/CategoryBlock'; 
import MapComponent from '../components/MapComponent';
import BookCard from '../components/BookCard';
import PageTransition from '../components/PageTransition'; 

const Home = () => {
  const [nearbyBooks, setNearbyBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]); 
  const [searchResults, setSearchResults] = useState([]); 
  
  // --- Live Search States ---
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [locationStatus, setLocationStatus] = useState('Detecting...');
  const [loading, setLoading] = useState(true); 
  const [nearbyLoading, setNearbyLoading] = useState(true); 
  const [viewMode, setViewMode] = useState('list'); 
  
  const [searchTerm, setSearchTerm] = useState(''); 
  const [searchCategory, setSearchCategory] = useState('All'); 

  const categories = [
    { title: 'Education', query: 'Education', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80' },
    { title: 'Fiction', query: 'Fiction', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80' },
    { title: 'Non-Fiction', query: 'Non-Fiction', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80' },
    { title: 'Comics', query: 'Comics', img: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=600&q=80' },
    { title: 'Mystery', query: 'Mystery', img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80' },
    { title: 'History', query: 'History', img: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80' },
    { title: 'Technology', query: 'Technology', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80' },
    { title: 'Health', query: 'Health', img: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80' },
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      let apiUrl = 'http://localhost:5000/api/books';
      
      try {
        setLoading(true);
        const recentRes = await axios.get(apiUrl);
        setRecentBooks(recentRes.data);
        setLoading(false); 
        setNearbyLoading(true); 

        if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(
             async (position) => {
               const { latitude, longitude } = position.coords;
               setLocationStatus('Nearby');
               try {
                 const nearbyRes = await axios.get(`${apiUrl}?lat=${latitude}&lng=${longitude}`);
                 setNearbyBooks(nearbyRes.data);
               } catch (err) {
                 console.error("GPS Error", err);
                 setLocationStatus('Error');
               } finally {
                 setNearbyLoading(false); 
               }
             },
             (error) => {
               setLocationStatus('Denied');
               setNearbyLoading(false); 
             },
             { enableHighAccuracy: true }
           );
        } else {
            setLocationStatus('No GPS');
            setNearbyLoading(false);
        }
      } catch (err) {
        setLoading(false);
        setNearbyLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (searchTerm.trim() || searchCategory !== 'All') {
        const results = recentBooks.filter(book => {
            const matchesText = 
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                book.author.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = 
                searchCategory === 'All' || book.category === searchCategory;
            return matchesText && matchesCategory;
        });
        setSearchResults(results);
    } else {
        setSearchResults([]);
    }
  }, [searchTerm, searchCategory, recentBooks]);

  const handleSearchChange = (text) => {
    setSearchTerm(text);
    if (text.length > 0) {
        const matches = recentBooks.filter(book => {
            const regex = new RegExp(`${text}`, "gi");
            return book.title.match(regex) || book.author.match(regex);
        });
        setSuggestions(matches.slice(0, 5)); 
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  };

  return (
    <PageTransition>
      {/* 1. Responsive Container: padding reduces on small screens */}
      <div className="container mx-auto px-2 sm:px-4 pb-20 max-w-7xl">
        
        {/* 2. SEARCH BAR: Z-Index lowered to 10 so Sidebar (z-50) stays on top */}
        <div className="mb-6 mt-4 relative z-10">
          <div className="flex w-full max-w-3xl mx-auto bg-white rounded-md shadow-sm border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative">
             
             {/* 3. Dropdown: Hidden on mobile (hidden), shown on small screens (sm:block) */}
             <div className="hidden sm:block relative border-r border-gray-300 bg-gray-50 hover:bg-gray-100 transition min-w-[130px]">
                <select 
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="appearance-none bg-transparent py-3 pl-4 pr-8 text-gray-700 font-semibold text-xs cursor-pointer focus:outline-none h-full w-full"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                      <option key={cat.query} value={cat.query}>{cat.title}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <span className="text-[10px]">▼</span>
                </div>
             </div>

             {/* Input: Flex-1 ensures it fills remaining space */}
             <input 
               type="text" 
               placeholder="Search books..." 
               value={searchTerm}
               onChange={(e) => handleSearchChange(e.target.value)}
               onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
               onFocus={() => searchTerm && setShowSuggestions(true)}
               className="flex-1 p-3 text-gray-800 outline-none placeholder-gray-400 text-sm font-medium rounded-l-md sm:rounded-l-none"
               autoComplete="off"
             />

             {/* Clear Button */}
             {(searchTerm || searchCategory !== 'All') && (
               <button 
                  onClick={() => { setSearchTerm(''); setSearchCategory('All'); }} 
                  className="px-2 text-gray-400 hover:text-red-500 transition"
               >
                  <FaTimes />
               </button>
             )}

             {/* Search Button */}
             <button className="bg-blue-600 px-4 sm:px-6 flex items-center justify-center hover:bg-blue-700 transition duration-200 text-white rounded-r-md">
                <FaSearch className="text-sm sm:text-lg" />
             </button>
          </div>

          {/* Live Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div onMouseDown={(e) => e.preventDefault()} className="absolute top-full left-0 right-0 max-w-3xl mx-auto mt-1 bg-white rounded-b-md shadow-xl border border-gray-200 overflow-hidden z-50">
                {suggestions.map((book) => (
                    <Link 
                        to={`/book/${book._id}`} 
                        key={book._id}
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-0 cursor-pointer text-left"
                    >
                        <div className="w-8 h-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-200">
                            {book.image ? (
                                <img src={book.image.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📚</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm truncate">{book.title}</h4>
                            <p className="text-xs text-gray-500 truncate">by {book.author}</p>
                        </div>
                        <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                            ₹{book.price}
                        </span>
                    </Link>
                ))}
            </div>
          )}
        </div>

        {/* --- VIEW CONTENT --- */}
        {(searchTerm || searchCategory !== 'All') ? (
          // SEARCH RESULTS
          <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex flex-wrap items-center gap-2">
                  Results 
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                      {searchResults.length} items
                  </span>
              </h2>
              
              {searchResults.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No books found.</p>
                      <button 
                          onClick={() => { setSearchTerm(''); setSearchCategory('All'); }} 
                          className="mt-2 text-blue-600 font-bold text-sm hover:underline"
                      >
                          Clear Filters
                      </button>
                  </div>
              ) : (
                  // Responsive Grid: 2 cols on mobile, 3 on tablet, 4 on laptop
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map(book => <BookCard key={book._id} book={book} />)}
                  </div>
              )}
          </div>
        ) : (
          // HOME PAGE
          <>
              {/* Filter / Toggle Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <div className="text-xs sm:text-sm text-gray-500 font-semibold flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                      {locationStatus !== 'Detecting...' ? <FaLocationArrow className="text-blue-500"/> : <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>}
                      {locationStatus}
                  </div>

                  <div className="flex bg-gray-200 p-1 rounded-lg w-full sm:w-auto">
                      <button 
                      onClick={() => setViewMode('list')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition text-xs sm:text-sm font-bold ${
                          viewMode === 'list' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-900'
                      }`}
                      >
                      <FaList /> List
                      </button>
                      <button 
                      onClick={() => setViewMode('map')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition text-xs sm:text-sm font-bold ${
                          viewMode === 'map' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-900'
                      }`}
                      >
                      <FaMapMarkedAlt /> Map
                      </button>
                  </div>
              </div>

              {viewMode === 'map' ? (
                  <div className="h-[400px] sm:h-[500px] w-full rounded-xl overflow-hidden shadow-md border border-gray-200">
                      <MapComponent books={nearbyBooks.length > 0 ? nearbyBooks : recentBooks} />
                  </div>
              ) : (
                  <>
                    {/* NEARBY BOOKS */}
                    {(nearbyBooks.length > 0 || nearbyLoading) && (
                        <BookRow 
                            title="📍 Nearby" 
                            books={nearbyBooks} 
                            loading={nearbyLoading} 
                            link="/view-all?type=nearby" 
                        />
                    )}

                      {/* Category Blocks */}
                      <div className="mb-10 mt-6">
                          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Categories</h2>
                          {/* 2 cols mobile, 4 cols desktop */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {categories.map((cat, index) => (
                                  <CategoryBlock 
                                  key={index} 
                                  title={cat.title} 
                                  image={cat.img} 
                                  category={cat.query} 
                                  />
                              ))}
                          </div>
                      </div>
                  </>
              )}
          </>
        )}

      </div>
    </PageTransition>
  );
};

export default Home;