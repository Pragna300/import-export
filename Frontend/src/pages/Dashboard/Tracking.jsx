import React, { useState } from 'react';
import config from '../../config';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Box, 
  Globe, 
  Cpu, 
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

const Tracking = () => {
  const [code, setCode] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!code) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.API_BASE_URL}/tracking/${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrackingData(data);
    } catch (err) {
      setError(err.message);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Live Shipment Tracking</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time journey mapping and AI-driven transit efficiency analysis.</p>
        </div>
        
        <form onSubmit={handleTrack} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter Shipment ID (e.g. SHP-ABCD1234)" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading || !code}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            Track Cargo
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-700 font-bold text-sm animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {trackingData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Journey Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Truck size={20} /></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Journey Timeline</p>
                    <p className="text-sm font-bold text-slate-900">{trackingData.shipment.shipment_code}</p>
                  </div>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {trackingData.shipment.status}
                </span>
              </div>
              
              <div className="p-8">
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
                  
                  <div className="space-y-12">
                    {/* Start: Origin */}
                    <div className="relative flex gap-8">
                      <div className="z-10 bg-slate-900 text-white p-2 rounded-full shadow-lg shadow-slate-200">
                        <MapPin size={16} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure Point</p>
                        <p className="text-lg font-black text-slate-900 leading-none">{trackingData.shipment.origin_country}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Cargo initialized and dispatched.</p>
                      </div>
                    </div>

                    {/* Dynamic History Points */}
                    {trackingData.history.map((t, i) => (
                      <div key={i} className="relative flex gap-8">
                        <div className="z-10 bg-blue-100 text-blue-600 p-2 rounded-full ring-4 ring-white">
                          <Clock size={16} />
                        </div>
                        <div className="pt-0.5">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                            {new Date(t.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          <p className="text-md font-bold text-slate-800 leading-none">{t.status} @ {t.location}</p>
                          {t.remarks && <p className="text-xs text-slate-500 font-medium mt-1 italic">"{t.remarks}"</p>}
                        </div>
                      </div>
                    ))}

                    {/* destination (Future/End) */}
                    <div className="relative flex gap-8">
                      <div className="z-10 bg-emerald-50 text-emerald-600 p-2 rounded-full ring-4 ring-white border border-emerald-100">
                        {trackingData.shipment.status === 'Delivered' ? <CheckCircle2 size={16} /> : <Box size={16} />}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Terminal Destination</p>
                        <p className="text-lg font-black text-slate-900 leading-none">{trackingData.shipment.destination_country}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Final clearance and delivery endpoint.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Analysis & Details */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Cpu size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                    <Sparkles size={16} className="text-blue-200" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">AI Logic Analysis</span>
                </div>
                
                <p className="text-lg font-bold leading-tight mb-6">
                  {trackingData.ai_insight || "Predictive models are analyzing current route efficiency..."}
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Reliability Score</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black">94.8%</span>
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[94.8%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Quick Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Consignment Details</h4>
              <div className="space-y-4">
                {[
                  { label: "Product", val: trackingData.shipment.product_name },
                  { label: "Quantity", val: `${trackingData.shipment.quantity} Units` },
                  { label: "Est. Value", val: `₹${parseFloat(trackingData.shipment.total_value).toLocaleString()}` },
                  { label: "Service Level", val: "Standard Air" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-xs font-bold text-slate-400">{item.label}</span>
                    <span className="text-xs font-black text-slate-800">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="w-full bg-white border-2 border-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group">
              Export Tracking Report
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      ) : !isLoading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Globe size={40} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Ready to Track?</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto font-medium">
            Enter your shipment ID in the search bar above to generate a live journey map and AI performance insight.
          </p>
        </div>
      )}
    </div>
  );
};

export default Tracking;
