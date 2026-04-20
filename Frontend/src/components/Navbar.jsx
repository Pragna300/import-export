import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-brand-navy text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-wider">SHNOOR</span>
            <span className="text-sm font-light hidden sm:block">INTERNATIONAL LLC</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#home" className="hover:text-blue-300 text-sm">Home</a>
            <a href="#services" className="hover:text-blue-300 text-sm">Services</a>
            <a href="#solutions" className="hover:text-blue-300 text-sm">Solutions</a>
            <a href="#tracking" className="hover:text-blue-300 text-sm">Shipment Tracking</a>
            <a href="#about" className="hover:text-blue-300 text-sm">About</a>
            <a href="#contact" className="hover:text-blue-300 text-sm">Contact</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex space-x-3">
            <Link to="/login" className="px-4 py-2 text-sm text-brand-navy bg-white hover:bg-slate-200 rounded font-semibold transition-colors text-center">
              Login
            </Link>
            <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors">
              Track Shipment
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-navy pb-4 px-4 space-y-2 border-t border-slate-700">
            <a href="#home" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">Home</a>
            <a href="#services" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">Services</a>
            <a href="#solutions" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">Solutions</a>
            <a href="#tracking" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">Shipment Tracking</a>
            <a href="#about" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">About</a>
            <a href="#contact" onClick={() => setIsOpen(false)} className="block hover:text-blue-300 py-2 text-sm">Contact</a>
            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-700">
              <Link to="/login" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-brand-navy bg-white rounded font-semibold text-center">Login</Link>
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded font-semibold">Track Shipment</button>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
