import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Anchor,
  Box,
  Loader2,
  FileText,
  DollarSign,
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
      const response = await fetch(`http://localhost:8000/shipments/?${queryParams}`);
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
      const response = await fetch('http://localhost:8000/shipments/', {
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
               <p className="text-xl font-black italic">500 Records Found</p>
               <div className="h-2 flex-1 bg-blue-400/50 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[100%]" />
               </div>
            </div>
         </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* ... table content remains same ... */}
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
                       <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all shadow-sm hover:shadow-md active:scale-90">
                         <ExternalLink size={16} />
                       </button>
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
