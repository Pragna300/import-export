import React, { useState, useEffect } from 'react';
import config from '../../config';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Anchor,
  Box,
  Loader2,
  FileText,
  DollarSign,
  Database,
  Brain,
  X
} from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Shipments = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    quantity: 1,
    unit_price: 0,
    origin_country: '',
    destination_country: '',
    currency: 'INR',
    description: ''
  });

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
          ...(search && { search })
      });
      const response = await fetch(`${config.API_BASE_URL}/shipments/?${queryParams}`);
      const data = await response.json();
      setShipments(data);
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [skip, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setSkip(0); // Reset to first page on search
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/shipments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error("Failed to create shipment");
      setIsModalOpen(false);
      setFormData({ product_name: '', quantity: 1, unit_price: 0, origin_country: '', destination_country: '', currency: 'INR', description: '' });
      fetchShipments();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextPage = () => setSkip(prev => prev + limit);
  const prevPage = () => setSkip(prev => Math.max(0, prev - limit));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Shipment Ledger</h1>
          <p className="text-slate-500 text-sm font-medium leading-tight">Comprehensive tracking and financial reconciliation of all logistics activity.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
           <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find Shipment ID or Product..."
                value={search}
                onChange={handleSearch}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
           </div>
           {shipments.length === 0 && !search && (
             <button 
               onClick={async () => {
                 if(window.confirm("Seed database with 500 records from CSV dataset?")) {
                   setIsLoading(true);
                   try {
                     const response = await fetch(`${config.API_BASE_URL}/import-data`, { method: 'POST' });
                     const data = await response.json();
                     alert(data.message || "Import initiated!");
                     fetchShipments();
                   } catch (err) {
                     alert("Seed failed: " + err.message);
                   } finally {
                     setIsLoading(false);
                   }
                 }
               }}
               className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 active:scale-95 transition-all"
             >
               <Database size={16} />
               Seed CSV Dataset
             </button>
           )}
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
           >
             <Box size={16} />
             Add Shipment
           </button>
        </div>
      </div>

      {/* Stats Quickbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items This Page</p>
            <p className="text-xl font-black text-slate-900">{shipments.length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-xl font-black text-blue-600">Active Audit</p>
         </div>
         <div className="bg-blue-600 p-4 rounded-xl border border-blue-600 shadow-sm shadow-blue-200 text-white md:col-span-2">
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Ledger Sync</p>
            <div className="flex items-center justify-between gap-4">
               <p className="text-xl font-black italic">{shipments.length} Records Found</p>
               <div className="h-2 flex-1 bg-blue-400/50 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[100%]" />
               </div>
            </div>
         </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Modal for Manual Entry */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Manual Shipment Entry">
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Product Name</label>
                   <input required type="text" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Industrial Gears" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Quantity</label>
                    <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                   </div>
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Unit Price (INR)</label>
                    <input required type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Origin Country</label>
                    <input required type="text" value={formData.origin_country} onChange={e => setFormData({...formData, origin_country: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Germany" />
                   </div>
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Destination Country</label>
                    <input required type="text" value={formData.destination_country} onChange={e => setFormData({...formData, destination_country: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. India" />
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Detailed Description</label>
                   <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none" placeholder="Enter shipment details for AI analysis..." />
                </div>
              </div>
              <div className="pt-4 flex flex-wrap gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all min-w-[120px]">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-2.5 px-8 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Box size={16} />}
                    {isSubmitting ? 'Processing AI Pipeline...' : 'Create Shipment'}
                 </button>
              </div>
            </form>
        </Modal>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Shipment ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product & Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Revenue</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                    <p className="text-sm font-medium text-slate-400 mt-4 uppercase tracking-widest">Querying Global Ledger...</p>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">No records found matching "{search}"</p>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="row-interactive group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                          <Box size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">{s.shipment_code}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.product_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <MapPin size={12} className="text-slate-400" />
                          {s.origin_country} → {s.destination_country}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <Calendar size={12} />
                          ETA: {new Date(s.estimated_arrival || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit ${
                          s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          s.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status}
                        </span>
                        <a 
                           href={`/dashboard/tracking?code=${s.shipment_code}`} 
                           className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline group/track"
                        >
                           Track cargo <ArrowRight size={10} className="group-hover/track:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-slate-900 tracking-tight">
                       ₹{parseFloat(s.total_value).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                         <FileText size={14} className="text-slate-400" />
                         <span className="text-xs font-bold text-slate-600">HSN: {s.hsn_code || 'N/A'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                            onClick={() => {
                                // Add logic to show intelligence card for this shipment
                                const win = window.open('', '_blank');
                                win.document.write(`
                                    <html>
                                        <head>
                                            <title>Shipment Intelligence Hub - ${s.shipment_code}</title>
                                            <style>
                                                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
                                                .card { background: white; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.1); }
                                                .header { border-bottom: 2px solid #2563eb; padding-bottom: 25px; margin-bottom: 30px; }
                                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                                                .label { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                                                .value { font-size: 15px; font-weight: 900; margin-top: 6px; color: #0f172a; }
                                                .badge { display: inline-block; background: #dbeafe; color: #2563eb; padding: 6px 16px; border-radius: 99px; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; }
                                                .btn { background: #0f172a; color: white; border: none; padding: 18px; border-radius: 14px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; width: 100%; margin-top: 30px; cursor: pointer; transition: all 0.3s; }
                                            </style>
                                        </head>
                                        <body onload="window.print()">
                                            <div class="card">
                                                <div class="header">
                                                    <div class="badge">Shipment Intelligence Verified</div>
                                                    <h2 style="margin:0; color:#0f172a; font-size: 24px;">Transit Audit Report</h2>
                                                    <p style="margin:5px 0 0 0; font-size:12px; color:#64748b; font-weight: 600;">Reference: ${s.shipment_code}</p>
                                                </div>
                                                <div class="grid">
                                                    <div class="item"><div class="label">Product Name</div><div class="value">${s.product_name}</div></div>
                                                    <div class="item"><div class="label">HSN Classification</div><div class="value">${s.hsn_code}</div></div>
                                                    <div class="item"><div class="label">Global Origin</div><div class="value">${s.origin_country}</div></div>
                                                    <div class="item"><div class="label">Terminal Destination</div><div class="value">${s.destination_country}</div></div>
                                                    <div class="item"><div class="label">Declared Financial Value</div><div class="value">₹${parseFloat(s.total_value).toLocaleString()}</div></div>
                                                    <div class="item"><div class="label">Service Class</div><div class="value">Standard Logistics</div></div>
                                                </div>
                                                <button class="btn" onclick="window.print()">Download Premium Audit Report (PDF)</button>
                                            </div>
                                        </body>
                                    </html>
                                `);
                                win.document.close();
                            }}
                            className="p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 rounded-xl transition-all shadow-sm active:scale-90 flex items-center gap-2 px-3"
                         >
                           <Brain size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Intelligence</span>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
             Showing {skip + 1} - {skip + shipments.length} 
           </p>
           <div className="flex items-center gap-2">
             <button 
               onClick={prevPage}
               disabled={skip === 0}
               className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
              >
               <ChevronLeft size={18} />
             </button>
             <button 
               onClick={nextPage}
               disabled={shipments.length < limit}
               className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
              >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Shipments;
