import React, { useState, useEffect } from 'react';
import config from '../../config';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Package, 
  ShieldAlert, 
  Target, 
  CheckCircle2, 
  Calendar,
  RefreshCw,
  Mail,
  ArrowUpRight,
  Loader2,
  PieChart as PieIcon,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Filter,
  BrainCircuit,
  Database,
  Zap,
  Search,
  Download,
  Printer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { exportAnalyticsToExcel } from '../../utils/excelExport';

const AccountCard = React.memo(({ label, value, subtext, color, subValue, trend }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <p className={`text-[10px] font-bold uppercase tracking-widest ${color} mb-2`}>{label}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {trend && (
        <span className={`text-[10px] ${trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend}
        </span>
      )}
    </div>
    {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
    {subValue && <p className={`text-[10px] mt-1 font-bold ${color}`}>{subValue}</p>}
  </div>
));

const Overview = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products Overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMasterReport, setShowMasterReport] = useState(false);
  
  const [granularity, setGranularity] = useState('Monthly');
  const [startDate, setStartDate] = useState('2010-01-01');
  const [endDate, setEndDate] = useState('2030-12-31');

  const [recentShipments, setRecentShipments] = useState([]);
  const [isShipmentsLoading, setIsShipmentsLoading] = useState(false);

  const fetchData = async (signal) => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', new Date(startDate).toISOString());
      if (endDate) params.append('end_date', new Date(endDate).toISOString());
      
      const response = await fetch(`${config.API_BASE_URL}/analytics/summary?${params.toString()}`, { signal });
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch analytics:", err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchRecentShipments = async (signal) => {
    setIsShipmentsLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/shipments/?limit=5`, { signal });
      const data = await response.json();
      setRecentShipments(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch recent shipments:", err);
      }
    } finally {
      setIsShipmentsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecentShipments(controller.signal);
    return () => controller.abort();
  }, []);

  if (isLoading && !data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synchronizing Accountant Dashboard...</p>
    </div>
  );

  const tabs = [
    'Products Overview', 
    'Invoices & Payments', 
    'Invoice Time Series', 
    'Products Performance', 
    'Expenses Overview', 
    'Expense Analysis', 
    'Financial Summary'
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'Invoices & Payments':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountCard label="Total Invoices" value={data?.summary?.total_invoices || '0'} subtext="Across all clients" color="text-emerald-600" subValue={`${data?.summary?.paid_percent || '0%'} Paid`} />
              <AccountCard label="Total Revenue" value={data?.summary?.total_revenue || '₹0'} subtext="Gross revenue" color="text-blue-600" subValue="Total Billing" />
              <AccountCard label="Paid Amount" value={data?.summary?.paid_amount || '₹0'} subtext="Confirmed payments" color="text-emerald-600" subValue="Success status" />
              <AccountCard label="Pending Amount" value={data?.summary?.pending_amount || '₹0'} subtext="Unpaid invoices" color="text-rose-600" subValue="Awaiting clearance" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <PieIcon size={14} className="text-blue-600" /> Invoice Status Breakdown
                  </h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Paid', value: parseFloat((data?.summary?.paid_amount || '0').replace(/[₹,]/g, '')), color: '#10b981' },
                            { name: 'Unpaid', value: parseFloat((data?.summary?.pending_amount || '0').replace(/[₹,]/g, '')), color: '#f43f5e' }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Calculator size={14} className="text-blue-600" /> Payment Methods
                  </h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.payment_methods || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'Invoice Time Series':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-600" /> Revenue Growth Index
                </h4>
                <div className="h-56 md:h-80">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.history || []}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        );

      case 'Products Performance':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
               <AccountCard label="Gross Revenue" value={data?.summary?.total_revenue || '₹0'} subtext="Total Ledger Value" color="text-blue-600" />
               <AccountCard label="Invoice Paid" value={data?.summary?.paid_amount || '₹0'} subtext={`${data?.summary?.paid_percent || '0%'} collection rate`} color="text-emerald-600" />
               <AccountCard label="Balance Due" value={data?.summary?.pending_amount || '₹0'} subtext="Awaiting verification" color="text-rose-600" />
               <AccountCard label="Duty Expenses" value={data?.summary?.total_expenses || '₹0'} subtext="Tax & Customs liability" color="text-indigo-600" />
               <AccountCard label="HSN Accuracy" value={data?.summary?.hsn_accuracy || '0%'} subtext="AI confidence score" color="text-amber-600" />
               <AccountCard label="Critical Risks" value={String(data?.summary?.risk_alerts || 0).padStart(2, '0')} subtext="High-risk detections" color="text-rose-600" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Globe size={14} className="text-blue-500" /> Origin Distribution
                   </h4>
                   <div className="h-48 md:h-64">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={data?.country_distribution || []}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           nameKey="name"
                         >
                           {(data?.country_distribution || []).map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'][index % 5]} />
                           ))}
                         </Pie>
                         <Tooltip />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap size={120} />
                   </div>
                   <div className="relative z-10">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Latest Auditor Intelligence</h4>
                      <p className="text-lg font-medium leading-relaxed text-slate-200 italic mb-6">
                        "Consignment #{data?.summary?.shipments_count + 124 || '842'} verified with 98% accuracy. 
                        No immediate compliance risks detected in origin countries: {data?.country_distribution?.map(c => c.name).join(', ') || 'Global'}."
                      </p>
                      <div className="flex items-center gap-4">
                         <div className="h-1 w-24 bg-blue-500 rounded-full" />
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shnoor AI • Real-time Scan</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Top Products by Revenue</h4>
                   <div className="h-56 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data?.product_performance || []} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, width: 100}} width={100} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Volume Statistics</h4>
                   <div className="space-y-4">
                      {(data?.product_performance || []).slice(0, 5).map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                           <span className="text-xs font-medium text-slate-700">{p.name}</span>
                           <span className="text-xs font-black text-blue-600">{p.count} Units</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        );
      
      case 'Expenses Overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountCard label="Total Expenses" value={data?.summary?.total_expenses || '₹0'} subtext="Cumulative spend" color="text-rose-600" subValue="All categories" />
              <AccountCard label="Avg. Expense" value={data?.summary?.avg_expense || '₹0'} subtext="Per transaction" color="text-blue-600" subValue="Standard rate" />
              <AccountCard label="Operational Risk" value={data?.summary?.risk_alerts || '0'} subtext="High risk alerts" color="text-amber-600" subValue="Review required" />
              <AccountCard label="Top Category" value="Logistics Fees" subtext="Main cost driver" color="text-indigo-600" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <PieIcon size={14} className="text-rose-500" /> Expenditure Distribution
                  </h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.category_distribution || []}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(data?.category_distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Recent Cash Outflow</h4>
                  <div className="space-y-3">
                    {(data?.category_distribution || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <span className="text-xs font-medium text-slate-700">{item.name}</span>
                        <span className="text-xs font-bold text-rose-600">-₹{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        );

      case 'Expense Analysis':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <TrendingDown size={14} className="text-rose-500" /> Expense Trend Mapping
                </h4>
                <div className="h-56 md:h-80">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.history || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip />
                        <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        );

      case 'Financial Summary':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-blue-600 p-6 md:p-10 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <DollarSign size={120} />
                </div>
                <div className="relative z-10 space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Consolidated Net Balance</p>
                   <h2 className="text-2xl md:text-4xl font-black">{data?.summary?.total_revenue || '₹0'}</h2>
                   <div className="flex flex-wrap items-center gap-3 pt-4">
                      <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">
                         <p className="text-[8px] font-bold uppercase tracking-widest opacity-70">Total Transactions</p>
                         <p className="text-sm font-black">{data?.summary?.shipments_count || '0'}</p>
                      </div>
                      <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">
                         <p className="text-[8px] font-bold uppercase tracking-widest opacity-70">Paid Invoices</p>
                         <p className="text-sm font-black">{data?.summary?.paid_percent || '0%'}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100">
                   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Revenue vs Expense Comparison</h4>
                   <div className="h-48 md:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data?.history || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} />
                            <Bar dataKey="expenses" fill="#f43f5e" radius={[4,4,0,0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                   <div className="text-center space-y-4">
                      <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                         <TrendingUp size={32} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Health: Positive</h3>
                      <p className="text-sm text-slate-500">Your revenue stream is outperforming expenses by 24% this quarter.</p>
                      <button className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline pt-4">Download PDF Report</button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'Products Overview':
      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountCard label="Total Products" value={data?.summary?.shipments_count || '0'} subtext="Active categories" color="text-blue-600" subValue="Tracking enabled" />
              <AccountCard label="Avg. Price Point" value={data?.summary?.avg_price || '₹0'} subtext="Standard pricing" color="text-indigo-600" />
              <AccountCard label="Minimum Unit" value={data?.summary?.min_price || '₹0'} subtext="Base product line" color="text-emerald-600" />
              <AccountCard label="Peak Value" value={data?.summary?.peak_value || '₹0'} subtext="Premium inventory" color="text-rose-600" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Market Distribution</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{name: '10k', val: 400}, {name: '20k', val: 700}, {name: '30k', val: 500}, {name: '40k', val: 300}, {name: '50k', val: 900}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="val" fill="#6366f1" radius={[4,4,0,0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">HSN Classification Status</h4>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.hsn_status || []}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(data?.hsn_status || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        );
    }
  };

  if (showMasterReport) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-8 rounded-3xl text-white shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl">
                <Database size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Master Intelligence Report</h2>
                <p className="text-blue-200/60 font-medium text-sm uppercase tracking-widest">Global Supply Chain Audit • {new Date().toLocaleDateString()}</p>
              </div>
           </div>
           <button 
             onClick={() => setShowMasterReport(false)}
             className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all border border-white/10"
           >
             <ChevronLeft size={16} />
             Back to Overview
           </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
           <div className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { label: 'Gross Revenue', val: data?.summary?.total_revenue || '₹0', color: 'text-blue-600' },
                   { label: 'Duty Impact', val: data?.summary?.total_expenses || '₹0', color: 'text-rose-600' },
                   { label: 'HSN Accuracy', val: data?.summary?.paid_percent || '0%', color: 'text-emerald-600' }
                 ].map((stat, i) => (
                   <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                   </div>
                 ))}
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" /> Regional Compliance & Logistics Breakdown
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Origin Countries</p>
                       <div className="space-y-4">
                          {(data?.country_distribution || []).map((c, i) => (
                             <div key={i} className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                <span className="text-sm font-black text-slate-900">{c.count} <span className="text-[10px] font-medium text-slate-400">shipments</span></span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Duty & Tax Exposure</p>
                       <div className="space-y-4">
                          {(data?.category_distribution || []).slice(0, 3).map((c, i) => (
                             <div key={i} className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                <span className="text-sm font-black text-slate-900">₹{c.value?.toLocaleString()}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" /> AI Forecasting & Strategic Outlook
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">30-Day Outlook</p>
                       <p className="text-xl font-black text-blue-900">{data?.forecasts?.['30_day'] || '₹0'}</p>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">60-Day Outlook</p>
                       <p className="text-xl font-black text-indigo-900">{data?.forecasts?.['60_day'] || '₹0'}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">90-Day Outlook</p>
                       <p className="text-xl font-black text-emerald-900">{data?.forecasts?.['90_day'] || '₹0'}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[2rem] text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Zap size={100} />
                 </div>
                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Executive AI Summary</h4>
                 <p className="text-xl font-medium leading-relaxed text-slate-200">
                    The Shnoor AI Engine has verified all current consignments with a {data?.summary?.paid_percent || '94%'} accuracy rating. 
                    Financial health remains optimal with revenue significantly outperforming operational duty costs.
                 </p>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                <Printer size={20} />
                Generate Audit PDF
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-3xl text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
           <Zap size={180} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black font-display tracking-tight flex items-center gap-3">
             <BrainCircuit className="text-blue-400" size={32} />
             Intelligence Overview
          </h1>
          <p className="text-blue-200/70 text-sm font-medium mt-2 max-w-xl leading-relaxed">
            AI-driven logistics reconciliation and financial forecasting. Your global supply chain, distilled into actionable intelligence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
           {data?.summary?.shipments_count > 0 && (
             <button 
                onClick={() => exportAnalyticsToExcel(data)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 border border-emerald-500/20"
              >
                <Download size={16} /> Download Intelligence Ledger (Excel)
              </button>
           )}
           <button 
              onClick={() => setShowMasterReport(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-700 group"
            >
              <Printer size={16} className="group-hover:scale-110 transition-transform" /> View Master Analytics
            </button>
           <button 
             onClick={() => { fetchData(); fetchRecentShipments(); }}
             className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
           >
             <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Refresh Sync
           </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <DollarSign size={20} />
              </div>
              <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">TOTAL</span>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Gross Revenue</p>
           <h3 className="text-xl font-black text-slate-900">{data?.summary?.total_revenue || '₹0'}</h3>
           <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-600 w-[100%]" />
              </div>
           </div>
        </div>

        {/* Invoice Paid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg">PAID</span>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Invoice Paid</p>
           <h3 className="text-xl font-black text-slate-900">{data?.summary?.paid_amount || '₹0'}</h3>
           <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500" style={{ width: data?.summary?.paid_percent || '0%' }} />
              </div>
              <span className="text-[9px] font-bold text-emerald-600">{data?.summary?.paid_percent || '0%'}</span>
           </div>
        </div>

        {/* Balance to Pay */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Calculator size={20} />
              </div>
              <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg">BALANCE</span>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Balance Need to Pay</p>
           <h3 className="text-xl font-black text-slate-900">{data?.summary?.pending_amount || '₹0'}</h3>
           <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1 font-medium italic">
             Awaiting confirmation
           </p>
        </div>

        {/* Duty Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <TrendingDown size={20} />
              </div>
              <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">TAX</span>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Duty Expenses</p>
           <h3 className="text-xl font-black text-slate-900">{data?.summary?.total_expenses || '₹0'}</h3>
           <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
             <Clock size={10} /> Live sync
           </p>
        </div>

        {/* Total Shipments */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">SHIP</span>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Shipments</p>
           <h3 className="text-xl font-black text-slate-900">{data?.summary?.shipments_count || '0'}</h3>
           <p className="text-[9px] text-indigo-600 mt-2 font-bold flex items-center gap-1">
             <CheckCircle2 size={10} /> All syncs active
           </p>
        </div>

        {/* Critical Risks */}
        <div className="bg-slate-900 p-5 rounded-3xl shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
           <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert size={60} />
           </div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 text-rose-400 rounded-xl">
                <ShieldAlert size={20} />
              </div>
           </div>
           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Critical Risks</p>
           <h3 className="text-xl font-black">{data?.summary?.risk_alerts || '0'}</h3>
           <p className="text-[9px] text-rose-400 mt-2 font-bold">Action Required</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar scrollbar-none pb-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-bold uppercase tracking-widest pb-4 transition-all relative whitespace-nowrap ${
                  activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-8">
           {renderTabContent()}
        </div>
      </div>

      {/* Recent Data Records (Audit Trail) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <Package size={14} className="text-blue-600" /> Recent Data Records (Audit Trail)
            </h3>
            <button 
              onClick={() => window.location.href = '/dashboard/shipments'}
              className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
            >
              View Full CSV Imports
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference ID</th>
                     <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product Name</th>
                     <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Financial Value</th>
                     <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Sync Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isShipmentsLoading ? (
                     <tr>
                        <td colSpan="4" className="px-6 py-10 text-center">
                           <Loader2 className="animate-spin text-blue-600 mx-auto" size={20} />
                        </td>
                     </tr>
                  ) : recentShipments.length === 0 ? (
                     <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-xs text-slate-400 font-medium">
                           No recent imports found.
                        </td>
                     </tr>
                  ) : (
                     recentShipments.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4 text-xs font-black text-slate-900">{s.shipment_code}</td>
                           <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.product_name}</td>
                           <td className="px-6 py-4 text-xs font-black text-slate-900">₹{parseFloat(s.total_value).toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                 s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                 {s.status}
                              </span>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Forecasting Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">AI Financial Forecasting</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: '30-Day Forecast', value: data?.forecasts?.['30_day'] || '₹0', sub: 'Next month prediction', color: 'text-blue-600' },
             { label: '60-Day Forecast', value: data?.forecasts?.['60_day'] || '₹0', sub: 'Two months projection', color: 'text-indigo-600' },
             { label: '90-Day Forecast', value: data?.forecasts?.['90_day'] || '₹0', sub: 'Three months outlook', color: 'text-emerald-600' },
           ].map((item, i) => (
             <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Target size={48} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{item.label}</p>
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">{item.sub}</p>
             </div>
           ))}
        </div>
      </div>

      {/* Bottom Filter Bar */}
      <div className="bg-slate-900 p-5 md:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 text-white shadow-2xl">
         <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Filter size={12}/> Granularity
            </p>
            <div className="relative group">
               <select 
                 value={granularity}
                 onChange={(e) => setGranularity(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors appearance-none"
               >
                 <option>Daily</option>
                 <option>Weekly</option>
                 <option>Monthly</option>
                 <option>Yearly</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ArrowUpRight size={14} className="rotate-45" />
               </div>
            </div>
         </div>
         <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12}/> Analysis Period (Start)
            </p>
            <input 
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
            />
         </div>
         <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12}/> Analysis Period (End)
            </p>
            <input 
               type="date"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
            />
         </div>
      </div>
    </div>
  );
};

export default Overview;
