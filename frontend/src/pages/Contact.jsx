import React, { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import PageTransition from '../components/PageTransition'; // <--- Import
const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/messages', formData);
      setStatus('✅ Message sent! We will contact you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
    } catch (error) {
      setStatus('❌ Error sending message. Please try again.');
    }
  };

  return (
    <PageTransition>
    <div className="container mx-auto p-4 max-w-2xl mt-10">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Contact Support</h2>
        
        {status && (
            <div className={`text-center p-3 rounded mb-4 font-bold ${status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {status}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Your Name</label>
            <input 
                type="text" 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-yellow-400 outline-none" 
                required
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-1">Email Address</label>
            <input 
                type="email" 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-yellow-400 outline-none" 
                required
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
            
          <div>
            <label className="block text-gray-700 font-bold mb-1">Subject</label>
            <input 
                type="text" 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-yellow-400 outline-none" 
                required
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})} 
            />
          </div>
            
          <div>
            <label className="block text-gray-700 font-bold mb-1">Message</label>
            <textarea 
                rows="5" 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-yellow-400 outline-none" 
                required
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})} 
            ></textarea>
          </div>
            
          <button className="w-full bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition flex items-center justify-center gap-2">
             <FaPaperPlane /> Send Message
          </button>
        </form>
      </div>
    </div>
    </PageTransition>
  );
};

export default Contact;