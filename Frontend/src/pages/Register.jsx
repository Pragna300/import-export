
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import config from '../config';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role] = useState('Admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // ✅ Google Register/Login (same flow)
  const handleGoogleRegister = async (credentialResponse) => {
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
        setError(data.detail || "Google signup failed");
      }
    } catch (err) {
      console.error(err);
      setError("Google signup error");
    }
  };

  // ✅ Manual Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith("@shnoor.com")) {
      setError('Only @shnoor.com emails allowed');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: role.toLowerCase()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created! Please login.');
        navigate('/login');
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">

        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}

        {/* ✅ Google Button */}
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleRegister}
            onError={() => setError("Google Signup Failed")}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex border rounded-xl">
            <User className="m-3 text-gray-400"/>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 p-3 outline-none"
            />
          </div>

          <div className="flex border rounded-xl">
            <Mail className="m-3 text-gray-400"/>
            <input
              type="email"
              placeholder="@shnoor.com Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-3 outline-none"
            />
          </div>

          <div className="flex border rounded-xl">
            <Lock className="m-3 text-gray-400"/>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 p-3 outline-none"
            />
          </div>

          <div className="flex border rounded-xl">
            <Lock className="m-3 text-gray-400"/>
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto"/> : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-bold">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

