import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Loader2,
  Download,
  Printer,
  ChevronLeft
} from 'lucide-react';

const Tracking = () => {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState(null);

  const performTrack = useCallback(async (trackingCode) => {
    if (!trackingCode) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.API_BASE_URL}/tracking/${trackingCode}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrackingData(data);
    } catch (err) {
      setError(err.message);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTrack = (e) => {
    if (e) e.preventDefault();
    performTrack(code);
  };

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      performTrack(urlCode);
    }
  }, [searchParams, performTrack]);

  useEffect(() => {
    let socket;
    if (trackingData && trackingData.shipment) {
      // Connect to the WebSocket tracking endpoint
      socket = new WebSocket(`${config.WS_BASE_URL}/tracking/ws`);
      
      socket.onopen = () => {
        console.log("WebSocket connected for live tracking...");
      };

      socket.onmessage = (event) => {
        try {
          // If the server broadcasts a message, it might be an update for this shipment
          const update = JSON.parse(event.data);
          if (update.shipment_id === trackingData.shipment.id || 
              update.shipment_code === trackingData.shipment.shipment_code) {
            // Trigger a refresh to get latest history and AI insight
            performTrack(trackingData.shipment.shipment_code);
          }
        } catch (e) {
          // It might be a simple text message
          console.log("WS Message:", event.data);
        }
      };

      socket.onerror = (err) => console.error("WS Error:", err);
      socket.onclose = () => console.log("WebSocket disconnected.");
    }
    
    return () => {
      if (socket) socket.close();
    };
  }, [trackingData?.shipment?.id, handleTrack]);

  if (showReport && trackingData) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-2xl">
                <Globe size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Transit Intelligence Report</h2>
                <p className="text-sm font-medium text-slate-400">Live Journey Audit for {trackingData.shipment.shipment_code}</p>
              </div>
           </div>
           <button 
             onClick={() => setShowReport(false)}
             className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
           >
             <ChevronLeft size={16} />
             Back to Journey Map
           </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden max-w-2xl mx-auto animate-in zoom-in-95 duration-700">
           <div className="p-10 space-y-10">
              <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                 <div>
                   <h1 className="text-2xl font-black text-blue-600 mb-1">Shnoor Logistics Report</h1>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Tracking Intelligence</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-slate-900">Shipment ID: {trackingData.shipment.shipment_code}</p>
                   <p className="text-[10px] font-bold text-slate-400">Generated: {new Date().toLocaleString()}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Product Name</p>
                    <p className="text-sm font-black text-slate-900">{trackingData.shipment.product_name}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Global Route</p>
                    <p className="text-sm font-black text-slate-900">{trackingData.shipment.origin_country} → {trackingData.shipment.destination_country}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Verified Transit Milestones</h3>
                 <div className="space-y-6 border-l-2 border-slate-50 pl-6 ml-2">
                   {trackingData.history.map((t, i) => (
                     <div key={i} className="relative">
                       <div className="absolute -left-[31px] top-1 w-3 h-3 bg-blue-600 rounded-full ring-4 ring-white" />
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(t.timestamp).toLocaleString()}</p>
                       <p className="text-sm font-black text-slate-900">{t.status} • {t.location}</p>
                       <p className="text-xs text-slate-500 font-medium italic mt-1">{t.remarks || "Checkpoint synchronization complete."}</p>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-3xl text-white">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">AI Predictive Analytics</p>
                 <p className="text-md font-bold leading-relaxed">{trackingData.ai_insight || "Predictive models are processing current transit vectors."}</p>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                <Printer size={18} />
                Download Official Audit (PDF)
              </button>
           </div>
        </div>
      </div>
    );
  }

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
            
            <button 
              onClick={() => setShowReport(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              <Download size={18} />
              View Intelligence Report
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-50" />
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
