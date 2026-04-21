import React, { useState, useEffect } from 'react';
import config from '../../config';
import {
  Search,
  Target,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Confidence meter mini-component ---
const ConfidenceMeter = ({ pct }) => {
  const color = pct >= 95 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-black text-slate-700 w-12 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
};

const HSN = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 15;
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchHSN = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/analytics/hsn`);
        const d = await response.json();
        setData(d);
      } catch (err) {
        console.error('Failed to fetch HSN records:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHSN();
  }, []);

  const handlePredict = async () => {
    if (!description.trim()) return;
    setIsPredicting(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/hsn/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: description, persist_result: false })
      });
      const result = await response.json();
      setPredictionResult(result);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="font-bold uppercase tracking-widest text-xs">Querying AI Classification Engine...</p>
      </div>
    );
  }

  const items = data?.items || [];
  const filtered = items.filter(i =>
    !searchQuery ||
    i.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.hsn_code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const verifiedCount = items.filter(i => i.status === 'Verified').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">HSN Classification Engine</h1>
          <p className="text-slate-500 text-sm font-medium">AI-powered Harmonized System code prediction across {data?.total || 0} products.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm shadow-sm">
          <Zap size={14} fill="currentColor" className="animate-pulse" />
          AI Engine Online
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Hash size={14} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Classified</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data?.total || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Target size={14} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Confidence</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{data?.avg_confidence || 0}%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg"><CheckCircle2 size={14} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</span>
          </div>
          <p className="text-2xl font-black text-violet-600">{verifiedCount}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl shadow-sm text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg"><Cpu size={14} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</span>
          </div>
          <p className="text-lg font-black">{predictionResult?.model_version || 'Pipeline v2.0'}</p>
        </div>
      </div>

      {/* Main Content: Classifier + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left: New Classification Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-blue-500" />
              New Classification
            </h3>
            <textarea
              placeholder="Describe your product in detail (e.g., 'Organic cotton t-shirt, men's, crew neck')..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
            <button 
              onClick={handlePredict}
              disabled={isPredicting || !description}
              className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPredicting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isPredicting ? 'Analyzing...' : 'Predict HSN Code'}
            </button>

            {predictionResult && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-3">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Prediction</p>
                   <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">{predictionResult.hsn_code}</span>
                </div>
                <div className="space-y-3">
                   <div>
                     <p className="text-xs font-bold text-slate-700">Classification Details</p>
                     <p className="text-[11px] text-slate-500 leading-tight mt-1">{predictionResult.description || 'Verified match from regulatory database.'}</p>
                   </div>
                   <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence</span>
                      <span className="text-xs font-black text-blue-600">{(predictionResult.confidence_score * 100).toFixed(1)}%</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">AI Engine</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Our classification engine uses trained models on 10,000+ HSN code mappings to predict the correct tariff code for any product description.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Accuracy', val: `${data?.avg_confidence || 98}%` },
                { label: 'Products Processed', val: data?.total || 0 },
                { label: 'Model Version', val: 'v2.0' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center border-t border-slate-700 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{row.label}</span>
                  <span className="text-sm font-black text-white">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Classifications Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            {/* Search bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                Classification Ledger
              </h3>
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find product or HSN Code..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                  className="w-full py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">HSN Code</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Confidence</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Model</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">No classifications match your search</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{item.product}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.shipment_code}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-black tracking-wider">
                            {item.hsn_code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <ConfidenceMeter pct={item.confidence} />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                            item.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.status === 'Verified' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{item.model_version}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button className="p-1.5 text-slate-300 hover:text-blue-600 bg-white border border-slate-100 rounded-md hover:border-blue-200 transition-all">
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="mt-auto px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page {page + 1} of {Math.max(totalPages, 1)} • {filtered.length} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HSN;
