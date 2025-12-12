import React, { useState } from 'react';
import { FaRobot, FaPaperPlane, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Genie 🧞‍♂️. Need help?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post('https://rebook-unyc.onrender.com/api/ai/chat', { message: input });
      setMessages(prev => [...prev, { text: res.data.reply, sender: "bot" }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "My brain is offline 😴", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center font-bold">
             <span>🧞‍♂️ ReBook Genie</span>
             <button onClick={() => setIsOpen(false)}><FaTimes/></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
             {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                      {msg.text}
                   </div>
                </div>
             ))}
             {loading && <div className="text-xs text-gray-400 ml-2">Genie is typing...</div>}
          </div>
          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
             <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 text-sm outline-none"/>
             <button type="submit" className="text-blue-600"><FaPaperPlane /></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition">
        {isOpen ? <FaTimes size={20} /> : <FaRobot size={24} />}
      </button>
    </div>
  );
};
export default ChatBot;