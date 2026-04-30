import React, { useState, useEffect } from 'react';
import config from '../../config';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  Calculator,
  TrendingUp,
  Loader2,
  Shield,
  Brain,
  Printer,
  Download,
  ChevronLeft,
  X
} from 'lucide-react';
import { exportItemToExcel } from '../../utils/excelExport';

// --- SVG Gauge Chart ---
const GaugeChart = ({ highCount, totalCount }) => {
  const pct = totalCount > 0 ? highCount / totalCount : 0;
  const angle = pct * 180;
  const r = 80;
  const cx = 100, cy = 100;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = cx + r * Math.cos(toRad(180 - angle));
  const arcY = cy - r * Math.sin(toRad(180 - angle));
  const largeArc = angle > 180 ? 1 : 0;

  const riskColor = pct > 0.3 ? '#ef4444' : pct > 0.15 ? '#f59e0b' : '#10b981';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-56 h-32">
        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Risk arc */}
        {angle > 0 && (
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${arcX} ${arcY}`}
            fill="none"
            stroke={riskColor}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ transition: "all 1s ease" }}
          />
        )}
        {/* Center label */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-lg font-black" fill="#0f172a" style={{ fontSize: '22px', fontWeight: '900' }}>
          {(pct * 100).toFixed(1)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em' }}>
          HIGH RISK EXPOSURE
        </text>
      </svg>
    </div>
  );
};

// --- Horizontal Distribution Bar ---
const DistBar = ({ dist }) => {
  const total = dist.reduce((a, b) => a + b.count, 0) || 1;
  const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
  return (
    <div className="space-y-3">
      {dist.map((d) => (
        <div key={d.level}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600">{d.level} Risk</span>
            <span className="text-xs font-black text-slate-900">{d.count} <span className="font-medium text-slate-400">shipments</span></span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(d.count / total) * 100}%`, backgroundColor: colors[d.level] || '#64748b' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Risk = () => {
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${config.API_BASE_URL}/analytics/risk`, { credentials: 'include' });
        const d = await r.json();
        setRiskData(d);
      } catch (e) {
        console.error('Risk fetch failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch_();
  }, []);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="font-bold uppercase tracking-widest text-xs">Scanning Regulatory Databases...</p>
      </div>
    );
  }

  const dist = riskData?.distribution || [];
  const topEntries = riskData?.top_entries || [];
  const metrics = riskData?.metrics || {};
  const totalCount = dist.reduce((a, b) => a + b.count, 0);
  const highCount = dist.find(d => d.level === 'High')?.count || 0;

  if (selectedEntry) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-2xl shadow-rose-200">
                 <ShieldAlert size={32} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Compliance Intelligence</h2>
                 <p className="text-sm font-medium text-slate-400">Audit Reference: {selectedEntry.shipment}</p>
              </div>
           </div>
           <button 
             onClick={() => setSelectedEntry(null)}
             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
           >
             <ChevronLeft size={16} />
             Back to Matrix
           </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden max-w-2xl mx-auto animate-in zoom-in-95 duration-700">
           <div className="bg-slate-900 p-8 text-white">
              <div className="flex justify-between items-start mb-8">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                   selectedEntry.level === 'High' ? 'bg-rose-500' : selectedEntry.level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                 }`}>
                   {selectedEntry.level} CRITICALITY LEVEL
                 </span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Date: {new Date().toLocaleDateString()}</p>
              </div>
              <h3 className="text-4xl font-black leading-tight mb-2">Compliance Audit Report</h3>
              <p className="text-slate-400 font-medium text-sm">Automated risk profiling and regulatory liability verification.</p>
           </div>

           <div className="p-10 grid grid-cols-2 gap-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-blue-500"/> Total Risk Score</p>
                 <p className="text-lg font-black text-slate-900">{selectedEntry.score.toFixed(0)} / 100</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calculator size={12} className="text-rose-500"/> Duty Exposure</p>
                 <p className="text-lg font-black text-slate-900">{selectedEntry.duty}</p>
              </div>
              <div className="col-span-2 space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Brain size={12} className="text-blue-500"/> AI Risk Rationale</p>
                 <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedEntry.reason}</p>
              </div>
           </div>

           <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(selectedEntry, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `risk_audit_${selectedEntry.shipment}.json`;
                  a.click();
                }}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                <Download size={18} />
                Download Risk Audit (JSON)
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">Duty & Risk Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium">Global risk exposure and automated duty liability across {totalCount} active shipments.</p>
        </div>
        <div className="flex gap-4">
          <div className={`bg-white px-5 py-2.5 border border-slate-200 rounded-xl shadow-sm flex items-center gap-4 transition-all duration-1000 ${highCount > 0 ? 'animate-breathe-subtle' : ''}`}>
            <div className={`p-2 rounded-lg ${highCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Critical Risks</p>
              <p className={`text-xl font-black leading-none ${highCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{String(highCount).padStart(2,'0')}</p>
            </div>
          </div>
          <div className="bg-slate-900 px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-4 text-white hover:bg-slate-800 transition-colors group">
            <div className="p-2 bg-white/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
              <Calculator size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Duty Est.</p>
              <p className="text-xl font-bold leading-none text-blue-100">{metrics.total_duty_est || '₹0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Row: Gauge + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gauge Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 self-start">
            <Activity size={18} className="text-rose-500" />
            Global Risk Exposure
          </h3>
          <GaugeChart highCount={highCount} totalCount={totalCount} />
          <div className="grid grid-cols-3 gap-2 w-full mt-2">
            {[
              { label: 'Low', color: 'bg-emerald-500', count: dist.find(d=>d.level==='Low')?.count || 0 },
              { label: 'Medium', color: 'bg-amber-500', count: dist.find(d=>d.level==='Medium')?.count || 0 },
              { label: 'High', color: 'bg-rose-500', count: dist.find(d=>d.level==='High')?.count || 0 },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg py-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
                <span className="text-sm font-black text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-500" />
            Compliance Risk Matrix
          </h3>
          <DistBar dist={dist} />
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Financial Metrics</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-rose-50 rounded-lg">
                <p className="text-[10px] font-bold text-rose-400 uppercase">High Risk Shipments</p>
                <p className="text-xl font-black text-rose-700">{highCount}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-[10px] font-bold text-amber-400 uppercase">Avg Risk Score</p>
                <p className="text-xl font-black text-amber-700">{metrics.avg_risk_score}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Total Duty Liability</p>
                <p className="text-lg font-black text-blue-700 truncate">{metrics.total_duty_est || '₹0'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Risky Shipments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            Highest Risk Shipments
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
            Top 10 by Score
          </span>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Shipment</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Risk Score</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Level</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Est. Duty Impact</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {topEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-sm text-slate-400 font-medium uppercase tracking-widest">
                  No high-risk entries found
                </td>
              </tr>
            ) : topEntries.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-3">
                  <span className="text-sm font-black text-slate-700 tracking-tight">{item.shipment}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className={`inline-flex w-10 h-10 rounded-full items-center justify-center font-black text-sm ${
                    item.level === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                    item.level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {item.score.toFixed(0)}
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                    item.level === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                    item.level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {item.level}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <p className="text-xs text-slate-500 font-medium">{item.reason}</p>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="text-sm font-black text-slate-900">{item.duty}</span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setSelectedEntry(item)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-100 rounded-lg transition-all"
                        title="View Compliance Audit"
                    >
                      <Brain size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Risk;
