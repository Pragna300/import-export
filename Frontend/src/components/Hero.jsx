import React from 'react';

const Hero = () => (
  <div id="home" className="bg-gradient-to-r from-brand-navy to-blue-900 text-white py-12 md:py-20 px-4 mt-0 relative overflow-hidden">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center relative z-10">
      <div className="md:w-1/2 space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          Powering Global Trade with Smart Import–Export Intelligence
        </h1>
        <p className="text-lg text-slate-300">
          AI-enabled shipment tracking, customs-ready documentation, duty insights, and global logistics visibility for modern businesses.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold shadow-lg transition-colors">
            Track Shipment
          </button>
          <button className="px-6 py-3 bg-transparent border border-slate-300 hover:bg-white hover:text-brand-navy rounded font-semibold transition-colors">
            Request Quote
          </button>
        </div>
        <div className="flex flex-wrap gap-3 pt-6">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/20">Real-time tracking</span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/20">Duty insights</span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/20">Document automation</span>
        </div>
      </div>
      <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center lg:justify-end">
        {/* Placeholder for world map vector or image */}
        <div className="w-full max-w-sm h-48 md:h-64 bg-slate-800/40 rounded-lg border border-slate-700 flex items-center justify-center border-dashed">
          <span className="text-slate-400 font-medium tracking-wide">[ World Map Illustration ]</span>
        </div>
      </div>
    </div>
  </div>
);

export default Hero;
