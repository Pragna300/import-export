import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import config from '../config';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    { role: 'assistant', content: 'Welcome to Shnoor AI. I can help you with shipment status, HSN classification, and logistics queries. How can I assist you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user', content: message };
    // Optimistically update history for UI
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Use the existing history + current user message to avoid stale state issues
      const backendHistory = [...history];

      const response = await fetch(`${config.API_BASE_URL}/ai/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: backendHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (error) {
       console.error("Chatbot connection error:", error);
       setHistory(prev => [...prev, { 
         role: 'assistant', 
         content: 'I am having trouble connecting to the AI system. Please ensure the backend is active and your API key is correctly configured.' 
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Chat Bubble */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group"
        >
          <MessageSquare size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-brand-navy p-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-blue-400">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Shnoor AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1"></span>
                  <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest leading-none">Powered by Llama 3.1</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl text-sm border border-slate-200 rounded-tl-none flex items-center gap-2 text-slate-400 font-medium">
                  <Loader2 size={16} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!isLoading && history.length === 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 bg-slate-50 border-t border-slate-100">
              {[
                "Track SHN-08897710",
                "How to classify HSN?",
                "Where is Shnoor located?",
                "What is Shnoor's mission?",
                "How to contact support?",
                "How to upload an invoice?",
                "Check recent shipments",
                "What is Shnoor AI?"
              ].map(q => (
                <button 
                  key={q}
                  onClick={() => {
                    setMessage(q);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-blue-600 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ask a question..."
              className="flex-1 text-sm bg-slate-100 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !message.trim()}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
