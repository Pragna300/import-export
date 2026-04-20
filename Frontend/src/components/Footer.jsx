import React from 'react';

const Footer = () => (
  <footer className="bg-brand-navy text-slate-300 py-10 md:py-12 px-4 border-t-4 border-blue-600">
    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      <div className="col-span-1 border-b border-slate-700/50 pb-6 sm:border-0 sm:pb-0">
        <div className="flex items-center space-x-2 mb-4 text-white">
          <span className="text-xl font-bold tracking-wider">SHNOOR</span>
        </div>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          Intelligent import-export coordination and smart logistics solutions for modern businesses.
        </p>
      </div>

      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
          <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
          <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
          <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Services</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#services" className="hover:text-white transition-colors">Shipment Tracking</a></li>
          <li><a href="#services" className="hover:text-white transition-colors">Document Intelligence</a></li>
          <li><a href="#services" className="hover:text-white transition-colors">Customs Duty</a></li>
          <li><a href="#services" className="hover:text-white transition-colors">Risk Monitoring</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal & Social</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          <li className="pt-2">
            <a href="#" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-6xl mx-auto pt-8 border-t border-slate-700 text-center text-xs text-slate-500">
      &copy; {new Date().getFullYear()} Shnoor International LLC. All rights reserved.
    </div>
  </footer>
);

export default Footer;
