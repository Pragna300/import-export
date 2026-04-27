
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import config from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const wasRegistered = query.get('registered');

  // ✅ Google Login Handler
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("access_token", data.access_token);
        navigate("/dashboard");
      } else {
        alert(data.detail || "Google login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Google login error");
    }
  };

  // ✅ Normal Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
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
      
      {/* Left Side */}
      <div className="hidden md:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <h1 className="text-4xl font-black">Secure Access</h1>
          <p className="text-slate-400">
            Access AI-powered logistics intelligence platform.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-20">
        <div className="w-full max-w-sm space-y-8">

          <div className="space-y-2">
            {wasRegistered && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl font-bold animate-in slide-in-from-top-2 mb-4">
                Registration Successful! Please login.
              </div>
            )}
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Login</h2>
            <p className="text-slate-500 font-medium">Use your corporate credentials or Google account to continue.</p>
          </div>

          {/* ✅ Google Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert("Google Login Failed")}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="text-xs font-bold text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? 'Loading...' : 'Login'}
              {!isLoading && <LogIn size={18}/>}
            </button>

            <p className="text-center text-sm">
              New user? <Link to="/register" className="text-blue-600 font-bold">Register</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

