import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const TrackingBanner = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket for Live Updates
  useEffect(() => {
    if (!shipment) return;

    const ws = new WebSocket('ws://localhost:8000/ws/tracking');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'tracking_update' && message.data.shipment_id === shipment.id) {
        // Update local shipment state with new data from WS
        setShipment(prev => ({
          ...prev,
          status: message.data.status,
          current_location: message.data.location
        }));
      }
    };

    return () => ws.close();
  }, [shipment?.id]);

  const handleTrack = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/shipments/?code=${trackingNumber}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setShipment(data[0]);
      } else {
        setError('No shipment found with this tracking number.');
        setShipment(null);
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="tracking" className="py-12 md:py-20 px-4 bg-blue-600 text-white relative">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl font-bold mb-4">Track Your Shipment Instantly</h2>
        <p className="mb-6 md:mb-8 text-blue-100">Enter your tracking number below to get live updates on your cargo.</p>
        
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row justify-center max-w-xl mx-auto gap-3">
          <input 
            type="text" 
            placeholder="e.g. SHN-123456" 
            className="flex-1 px-4 py-3 rounded text-slate-800 focus:outline-none focus:ring-2 focus:ring-white shadow-sm font-bold"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-8 py-3 bg-brand-navy hover:bg-slate-800 rounded font-bold transition-colors shadow-sm disabled:opacity-70"
          >
            {isLoading ? 'Searching...' : 'Track Now'}
          </button>
        </form>

        {error && <p className="mt-4 text-rose-200 font-bold animate-pulse">{error}</p>}

        {shipment && (
          <div className="mt-8 bg-white text-left p-6 rounded-2xl shadow-2xl max-w-xl mx-auto text-slate-800 border border-slate-100 animate-fade-in">
             <div className="flex flex-wrap justify-between items-start gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipment Identifier</span>
                   <span className="font-black text-xl text-brand-navy">{shipment.shipment_code}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Status</span>
                   <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">
                     {shipment.status}
                   </span>
                </div>
             </div>
             
             <div className="space-y-6">
                {/* AI Insight Section */}
                {shipment.ai_insight && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 animate-in fade-in zoom-in duration-500">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                       <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Predictive Insight</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                        "{shipment.ai_insight}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Country</p>
                      <p className="text-sm font-bold text-slate-800">{shipment.origin_country}</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg animate-bounce">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Location</p>
                      <p className="text-sm font-bold text-slate-800">{shipment.current_location || 'Port of Origin'}</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                      <p className="text-sm font-bold text-slate-800">{shipment.destination_country}</p>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 italic">Connected to Live Fleet Tracking Network</p>
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingBanner;
