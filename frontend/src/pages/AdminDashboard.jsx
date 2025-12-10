import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { FaTrash, FaEnvelope, FaUserShield, FaBook, FaChartPie, FaRupeeSign, FaUserSlash, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'; 
import { ToastContainer, toast } from 'react-toastify'; // <--- NEW IMPORT
import PageTransition from '../components/PageTransition';
import 'react-toastify/dist/ReactToastify.css'; // <--- CSS IMPORT
const AdminDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [books, setBooks] = useState([]); 
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); 
  const navigate = useNavigate();

  // --- MODAL STATE (To replace boring window.confirm) ---
  const [modal, setModal] = useState({ show: false, type: null, id: null, title: '', message: '' });

  // --- AMAZON COLOR PALETTE ---
  const AMAZON_COLORS = ['#FF9900', '#232F3E', '#007185', '#B12704', '#767676'];

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.isAdmin) { 
         toast.error("Access Denied: Admins Only"); // <--- TOAST
         navigate('/');
         return;
      }

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      try {
        const msgRes = await axios.get('https://rebook-unyc.onrender.com/api/messages', config);
        setMessages(msgRes.data);

        const bookRes = await axios.get('https://rebook-unyc.onrender.com/api/books');
        setBooks(bookRes.data);

        const userRes = await axios.get('https://rebook-unyc.onrender.com/api/users', config);
        setUsers(userRes.data);

      } catch (error) { toast.error("Error fetching dashboard data"); }
    };
    fetchData();
  }, [navigate]);

  // --- ANALYTICS DATA PROCESSING ---
  const totalInventoryValue = useMemo(() => {
    return books.reduce((acc, book) => acc + (Number(book.price) || 0), 0);
  }, [books]);

  const categoryData = useMemo(() => {
    const categories = {};
    books.forEach(book => {
        const cat = book.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [books]);

  const userGrowthData = useMemo(() => {
    const growth = {};
    users.forEach(user => {
        const date = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        growth[date] = (growth[date] || 0) + 1;
    });
    return Object.keys(growth).map(key => ({ date: key, users: growth[key] }));
  }, [users]);

  // --- CONFIRMATION HANDLERS (Open the Modal) ---
  const initiateDeleteMessage = (id) => {
    setModal({ show: true, type: 'message', id, title: 'Delete Message?', message: 'This action cannot be undone.' });
  };

  const initiateForceDelete = (id) => {
    setModal({ show: true, type: 'book', id, title: 'Force Delete Listing?', message: 'This will permanently remove the book from the marketplace.' });
  };

  const initiateBanUser = (id) => {
    setModal({ show: true, type: 'user', id, title: 'Ban User?', message: 'This user will lose access to their account immediately.' });
  };

  // --- EXECUTE ACTIONS (Run when Modal "Confirm" is clicked) ---
  const handleConfirmAction = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    
    try {
        if (modal.type === 'message') {
            await axios.delete(`https://rebook-unyc.onrender.com/api/messages/${modal.id}`, config);
            setMessages(messages.filter(m => m._id !== modal.id));
            toast.success("Message deleted successfully");
        } else if (modal.type === 'book') {
            await axios.delete(`https://rebook-unyc.onrender.com/api/books/${modal.id}`, config);
            setBooks(books.filter(b => b._id !== modal.id));
            toast.success("Listing removed from marketplace");
        } else if (modal.type === 'user') {
            await axios.delete(`https://rebook-unyc.onrender.com/api/users/${modal.id}`, config);
            setUsers(users.filter(u => u._id !== modal.id));
            toast.success("User has been banned");
        }
    } catch (err) {
        toast.error(err.response?.data?.message || "Operation failed");
    } finally {
        setModal({ ...modal, show: false }); // Close modal
    }
  };

  // --- TAB BUTTON COMPONENT ---
  const TabButton = ({ name, label, icon }) => (
    <button 
      onClick={() => setActiveTab(name)}
      className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-all duration-200 border ${
        activeTab === name 
          ? 'bg-[#febd69] border-[#a88734] text-[#111] shadow-sm' 
          : 'bg-white border-gray-300 text-gray-600 hover:bg-[#f7fafa]'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#eaeded] pb-20 relative"> 
      
      {/* 1. HEADER (Z-Index Fixed: Changed from z-50 to z-20 to sit BEHIND sidebar) */}
      <div className="bg-[#131921] shadow-md border-b border-[#232f3e] sticky top-0 z-20"> 
        <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-white">
                         <div className="flex items-center gap-2">
                             <span className="text-2xl font-bold tracking-tight">ReBook <span className="text-[#febd69] italic">Admin</span></span>
                         </div>
                        <p className="text-[11px] text-[#ccc] font-medium flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-[#00d553] rounded-full animate-pulse"></span> Seller Central Live
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3 text-xs font-bold text-white">
                    <div className="px-4 py-2 bg-[#232f3e] rounded border border-gray-600">
                        Total Users: {users.length}
                    </div>
                    <div className="px-4 py-2 bg-[#232f3e] rounded border border-gray-600">
                        Active Listings: {books.length}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. TABS */}
      <div className="container mx-auto px-6 mt-6 mb-6">
        <div className="flex flex-wrap gap-3 justify-center md:justify-start border-b border-gray-300 pb-4">
            <TabButton name="overview" label="Dashboard Overview" icon={<FaChartPie />} />
            <TabButton name="messages" label="Buyer Messages" icon={<FaEnvelope />} />
            <TabButton name="books" label="Inventory" icon={<FaBook />} />
            <TabButton name="users" label="User Accounts" icon={<FaUserShield />} />
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="container mx-auto px-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#232f3e] rounded-lg p-6 text-white shadow-sm border-l-4 border-[#febd69]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-300 text-sm font-medium mb-1">Total Inventory Value</p>
                                <h3 className="text-3xl font-bold text-white">₹{totalInventoryValue.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-white/10 rounded">
                                <FaRupeeSign size={20} className="text-[#febd69]"/>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">Registered Users</p>
                                <h3 className="text-3xl font-bold text-[#111]">{users.length}</h3>
                            </div>
                            <div className="p-2 bg-[#f0f2f2] rounded text-[#007185]">
                                <FaUserShield size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">Inbox Messages</p>
                                <h3 className="text-3xl font-bold text-[#111]">{messages.length}</h3>
                            </div>
                            <div className="p-2 bg-[#f0f2f2] rounded text-[#007185]">
                                <FaEnvelope size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-[#111] mb-6">User Sign-up Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={userGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" stroke="#555" fontSize={12} tickLine={false}/>
                                    <YAxis stroke="#555" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }} />
                                    <Line type="monotone" dataKey="users" stroke="#FF9900" strokeWidth={3} dot={{ r: 4, fill: '#131921' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-[#111] mb-6">Inventory by Category</h3>
                        <div className="h-64 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={AMAZON_COLORS[index % AMAZON_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
            <div className="grid gap-4 animate-fadeIn">
                {messages.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200">No new messages 📭</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-[#007185] hover:underline cursor-pointer">{msg.subject}</h3>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded border text-gray-600">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">{msg.message}</p>
                                <div className="text-xs text-gray-500">From: <span className="font-medium">{msg.name}</span> ({msg.email})</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`} className="px-4 py-2 bg-[#f0f2f2] text-[#111] border border-[#d5d9d9] rounded shadow-sm hover:bg-[#e7e9ec] text-sm font-medium">Reply</a>
                                <button onClick={() => initiateDeleteMessage(msg._id)} className="px-4 py-2 bg-white text-red-600 border border-gray-300 rounded shadow-sm hover:bg-red-50 text-sm font-medium">Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* BOOKS TAB */}
        {activeTab === 'books' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                    {books.map((book) => (
                        <div key={book._id} className="relative group bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-all duration-300">
                            <div className="h-48 bg-[#f7f7f7] flex items-center justify-center p-4">
                                <img src={book.image?.url} alt={book.title} className="max-h-full object-contain mix-blend-multiply"/>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-[#007185] truncate hover:underline cursor-pointer mb-1">{book.title}</h3>
                                <div className="text-lg font-bold text-[#B12704] mb-2"><span className="text-xs align-top">₹</span>{book.price}</div>
                                <p className="text-xs text-gray-500 mb-4">Seller: {book.seller?.name || 'Unknown'}</p>
                                <button onClick={() => initiateForceDelete(book._id)} className="w-full text-sm bg-white border border-gray-300 rounded shadow-sm py-1.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition">Delete Listing</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f7f7f7] text-gray-600 text-xs uppercase tracking-wider border-b">
                        <tr>
                            <th className="px-6 py-3 font-bold">User</th>
                            <th className="px-6 py-3 font-bold">Role</th>
                            <th className="px-6 py-3 font-bold">Date Joined</th>
                            <th className="px-6 py-3 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-[#f7fafa] transition">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user.isAdmin ? 'bg-[#232f3e]' : 'bg-[#ccc]'}`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#007185] hover:underline cursor-pointer">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    {user.isAdmin ? <span className="text-[#e77600] font-bold text-xs">Admin</span> : <span className="text-gray-500 text-xs">Customer</span>}
                                </td>
                                <td className="px-6 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-right">
                                    {!user.isAdmin && (
                                        <button onClick={() => initiateBanUser(user._id)} className="text-red-600 hover:text-red-800 hover:underline text-xs font-medium">Ban User</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

      </div>

      {/* --- CUSTOM CONFIRMATION MODAL (AMAZON STYLE) --- */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md border border-gray-300 overflow-hidden">
                <div className="bg-[#f0f2f2] px-6 py-4 border-b border-gray-300 flex items-center gap-2">
                    <FaExclamationTriangle className="text-[#e77600]" />
                    <h3 className="font-bold text-gray-800">{modal.title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 text-sm">{modal.message}</p>
                </div>
                <div className="px-6 py-4 bg-[#f7f7f7] flex justify-end gap-3 border-t border-gray-200">
                    <button 
                        onClick={() => setModal({ ...modal, show: false })}
                        className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmAction}
                        className="px-4 py-2 bg-[#B12704] border border-red-700 rounded shadow-sm text-sm font-medium text-white hover:bg-red-800"
                    >
                        Confirm Action
                    </button>
                </div>
            </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </div>
    </PageTransition>
  );
};

export default AdminDashboard;