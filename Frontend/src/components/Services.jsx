import React from 'react';
import { ShipIcon, DocumentIcon, GlobeIcon, ShieldIcon } from './Icons';

const Services = () => (
  <div id="services" className="py-12 md:py-20 px-4 bg-brand-light">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl font-bold text-brand-navy">Our Services</h2>
        <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Comprehensive solutions for modern supply chains designed to simplify your logistics workflow.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="mb-4 bg-blue-50 w-16 h-16 rounded flex items-center justify-center"><ShipIcon /></div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">Smart Tracking</h3>
          <p className="text-slate-600 text-sm">Monitor cargo movement globally with live updates and accurate ETA forecasting.</p>
        </div>
        
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="mb-4 bg-blue-50 w-16 h-16 rounded flex items-center justify-center"><DocumentIcon /></div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">Document Intelligence</h3>
          <p className="text-slate-600 text-sm">Upload invoices and shipping documents with automated validation support.</p>
        </div>
        
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="mb-4 bg-blue-50 w-16 h-16 rounded flex items-center justify-center"><GlobeIcon /></div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">Duty Insights</h3>
          <p className="text-slate-600 text-sm">Estimate duties and taxes across multiple countries with up-to-date trade rules.</p>
        </div>
        
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="mb-4 bg-blue-50 w-16 h-16 rounded flex items-center justify-center"><ShieldIcon /></div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">Risk Monitoring</h3>
          <p className="text-slate-600 text-sm">Identify shipment or compliance risks early through intelligent pattern detection.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Services;
