import React from 'react';

const Contact = () => (
  <div id="contact" className="py-12 md:py-20 px-4 bg-slate-50 border-t border-slate-200">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
      <div className="md:w-1/3">
        <h2 className="text-3xl font-bold text-brand-navy mb-4">Contact Us</h2>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">Reach out to our team to discuss your global logistics needs and find the right solution for your business.</p>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Dubai Office</h4>
              <p className="text-slate-500 text-sm">Business Bay, Dubai, UAE</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">India Office</h4>
              <p className="text-slate-500 text-sm">Mumbai, Maharashtra, India</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Support</h4>
              <p className="text-blue-600 text-sm font-medium">support@shnoor.com</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:w-2/3 bg-white p-8 rounded border border-slate-200 shadow-sm">
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="john@company.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="Your Company Ltd" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea rows="4" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" placeholder="How can we help you?"></textarea>
          </div>
          <button type="button" className="bg-brand-navy text-white px-6 py-2.5 rounded text-sm font-bold hover:bg-slate-800 transition-colors w-full sm:w-auto">
            Send Inquiry
          </button>
        </form>
      </div>
    </div>
  </div>
);

export default Contact;
