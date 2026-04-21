import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import config from '../config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // API call to Backend/auth/forgot-password
      const response = await fetch(`${config.API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setIsSent(true);
      } else {
        alert('Error sending reset link. Please check the email.');
      }
    } catch (err) {
      console.error(err);
      alert('Communication error with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            {isSent ? <CheckCircle size={32} /> : <Mail size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{isSent ? 'Check Your Email' : 'Forgot Password?'}</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            {isSent 
              ? `We've sent a password reset link to ${email}. Please check your inbox and spam folder.` 
              : "No worries, it happens. Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              {!isLoading && <Send size={18} />}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <button 
              onClick={() => setIsSent(false)}
              className="text-blue-600 font-bold hover:underline text-sm"
            >
              Didn't receive code? Try again
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs font-medium tracking-widest uppercase">
        Shnoor International Logistics © 2026
      </p>
    </div>
  );
};

export default ForgotPassword;
