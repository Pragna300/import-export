import React from 'react';
import { CheckIcon } from './Icons';

const Solutions = () => (
  <div id="solutions" className="py-12 md:py-20 px-4 bg-white border-y border-slate-100">
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 md:gap-12">
      <div className="lg:w-1/2">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">Built for Modern Global Trade Operations</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Our integrated platform simplifies complex logistics, providing a single source of truth for all your import-export requirements. We help you stay compliant while moving cargo faster.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center"><CheckIcon /><span className="text-sm font-medium text-slate-700">Import management support</span></div>
          <div className="flex items-center"><CheckIcon /><span className="text-sm font-medium text-slate-700">Export workflow coordination</span></div>
          <div className="flex items-center"><CheckIcon /><span className="text-sm font-medium text-slate-700">Multi-country compliance</span></div>
          <div className="flex items-center"><CheckIcon /><span className="text-sm font-medium text-slate-700">AI shipment visibility</span></div>
          <div className="flex items-center"><CheckIcon /><span className="text-sm font-medium text-slate-700">Centralized dashboard</span></div>
        </div>
      </div>
      <div className="lg:w-1/2 w-full">
        <div className="w-full h-56 md:h-80 bg-slate-50 rounded border border-slate-200 shadow-inner flex items-center justify-center p-6 relative overflow-hidden">
          {/* Simple Dashboard Dummy Graphic */}
          <div className="absolute top-4 left-4 right-4 h-12 bg-white border border-slate-200 rounded shadow-sm flex items-center px-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 mr-3"></div>
            <div className="w-32 h-3 bg-slate-200 rounded"></div>
          </div>
          <div className="w-full mt-16 grid grid-cols-3 gap-4">
             <div className="h-24 bg-blue-50 border border-blue-100 rounded"></div>
             <div className="h-24 bg-white border border-slate-200 rounded shadow-sm"></div>
             <div className="h-24 bg-white border border-slate-200 rounded shadow-sm"></div>
             <div className="col-span-3 h-32 bg-white border border-slate-200 rounded shadow-sm mt-2"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
             <span className="bg-white px-4 py-2 border border-slate-200 rounded text-sm font-bold text-slate-600 shadow-sm">[ Dashboard Interface Placeholder ]</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Solutions;
