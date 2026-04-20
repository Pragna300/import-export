import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronDown, User, LogIn, Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Client');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validations
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: role.toLowerCase()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully! Please login to continue.');
        navigate('/login');
      } else {
        // Handle backend error messages
        setError(data.detail || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      setError('Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative p-4 py-8">
      <div className="w-full max-w-[420px] p-6 md:p-10 bg-white rounded-[24px] shadow-sm border border-[#F1DDC8]">
        <h2 className="text-2xl md:text-[28px] font-bold text-center text-slate-900 mb-8 tracking-tight">Create Account</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Input */}
          <div className="flex border border-[#e8d5c4] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1D3260] transition-shadow">
            <div className="px-4 py-3 md:py-3.5 bg-white flex items-center justify-center">
              <User className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            </div>
            <input 
              type="text" 
              placeholder="Full Name" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-3 md:py-3.5 bg-[#eef3fb] text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
          </div>

          {/* Email Input */}
          <div className="flex border border-[#e8d5c4] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1D3260] transition-shadow">
            <div className="px-4 py-3 md:py-3.5 bg-white flex items-center justify-center">
              <Mail className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            </div>
            <input 
              type="email" 
              placeholder="Work Email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-3 md:py-3.5 bg-[#eef3fb] text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative flex border border-[#e8d5c4] rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1D3260] transition-shadow duration-200">
            <select 
              className="block flex-1 w-full pl-4 pr-10 py-3.5 bg-white text-slate-800 appearance-none focus:outline-none font-medium"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Client">Client</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-800" />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex border border-[#e8d5c4] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1D3260] transition-shadow">
            <div className="px-4 py-3 md:py-3.5 bg-white flex items-center justify-center">
              <Lock className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-3 py-3 md:py-3.5 bg-[#eef3fb] text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
          </div>

          {/* Confirm Password Input */}
          <div className="flex border border-[#e8d5c4] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1D3260] transition-shadow">
            <div className="px-4 py-3 md:py-3.5 bg-white flex items-center justify-center">
              <Lock className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            </div>
            <input 
              type="password" 
              placeholder="Confirm Password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 px-3 py-3 md:py-3.5 bg-[#eef3fb] text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full !mt-6 bg-[#203461] text-white font-bold py-4 px-4 rounded-xl hover:bg-[#15254a] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D3260] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Register Account
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-[15px] text-[#203461]">
            <span className="text-slate-500">Already have an account?</span> <Link to="/login" className="font-semibold hover:underline ml-1">Login</Link>
          </p>
          <div className="flex flex-col gap-2 pt-2 text-[14px] text-slate-500">
            <Link to="/terms" className="hover:text-slate-800 transition-colors">Terms and Conditions</Link>
            <Link to="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
