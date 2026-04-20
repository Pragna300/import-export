import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        // Defaulting all employees to dashboard as per user request
        navigate('/dashboard');
      } else {
        alert('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed. Server might be down.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row shadow-2xl overflow-hidden">
      
      {/* Branding Side (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 bg-brand-navy relative items-center justify-center p-12 overflow-hidden">
        <div className="z-10 max-w-md space-y-6">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-4xl text-white mb-10 shadow-2xl shadow-blue-500/20">S</div>
           <h1 className="text-4xl font-black text-white leading-tight">Secure Access for <br/> Logistics Professionals.</h1>
           <p className="text-slate-400 font-medium text-lg leading-relaxed">
             Access the AI intelligence suite to manage global shipments, verify document compliance, and analyze trade risks.
           </p>
           <div className="flex items-center gap-4 pt-8">
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-navy bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-tighter">OP{i}</div>
                 ))}
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Join 500+ global operators</p>
           </div>
        </div>
        
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full blur-[150px] opacity-10 -ml-48 -mb-48"></div>
      </div>

      {/* Login Form Side */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-20">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
          <div className="md:hidden flex flex-col items-center mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-2xl text-white mb-4">S</div>
            <h2 className="text-2xl font-black text-slate-900">SHNOOR PORTAL</h2>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Login.</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">Please enter your corporate credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium" 
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Key?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-medium" 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-95 translate-y-0 hover:-translate-y-1"
            >
              {isLoading ? 'Processing...' : 'Access My Dashboard'}
              {!isLoading && <LogIn size={20} />}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs font-bold tracking-widest uppercase py-4">
             Shnoor Global Systems — Intelligence Verified
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
