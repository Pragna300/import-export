import React, { useState, useEffect } from 'react';
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
  Filter
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

const AccountCard = ({ label, value, subtext, color, subValue, trend }) => (
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
);

const Overview = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products Overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [granularity, setGranularity] = useState('Monthly');
  const [startDate, setStartDate] = useState('15-10-2025');
  const [endDate, setEndDate] = useState('15-04-2026');

  const [recentShipments, setRecentShipments] = useState([]);
  const [isShipmentsLoading, setIsShipmentsLoading] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`http://localhost:8000/analytics/summary`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchRecentShipments = async () => {
    setIsShipmentsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/shipments/?limit=5`);
      const data = await response.json();
      setRecentShipments(data);
    } catch (err) {
      console.error("Failed to fetch recent shipments:", err);
    } finally {
      setIsShipmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRecentShipments();
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
                            { name: 'Paid', value: parseFloat(data?.summary?.paid_amount.replace(/[₹,]/g, '') || 0), color: '#10b981' },
                            { name: 'Unpaid', value: parseFloat(data?.summary?.pending_amount.replace(/[₹,]/g, '') || 0), color: '#f43f5e' }
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
              <AccountCard label="Avg. Price Point" value="₹15,000" subtext="Standard pricing" color="text-indigo-600" />
              <AccountCard label="Minimum Unit" value="₹10,000" subtext="Base product line" color="text-emerald-600" />
              <AccountCard label="Peak Value" value="₹50,000" subtext="Premium inventory" color="text-rose-600" />
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
                          data={[{name: 'Classified', value: 70}, {name: 'Pending', value: 20}, {name: 'Error', value: 10}]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f43f5e" />
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

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Upper Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="overflow-hidden">
          <h1 className="text-2xl font-bold text-slate-900">Accountant Overview Dashboard</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1 max-w-full truncate whitespace-normal">Track performance, finances, and activity at a glance. Your financial snapshot in one unified view.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors flex items-center gap-2">
             <Mail size={16} /> Setup Email
           </button>
           <button 
             onClick={() => { fetchData(); fetchRecentShipments(); }}
             className="bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
           >
             <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Refresh All Data
           </button>
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
            <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none">
               {startDate}
            </div>
         </div>
         <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12}/> Analysis Period (End)
            </p>
            <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none">
               {endDate}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Overview;
