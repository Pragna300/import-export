import React, { useState, useEffect, useRef } from 'react';
import config_env from '../../config';
import {
  FileUp,
  Search,
  Filter,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Trash2,
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Box,
  Globe,
  DollarSign,
  Download,
  FileStack,
  Printer,
  FileJson
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dropdown = ({ title, icon: Icon, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${open ? `border-${color}-200 bg-${color}-50/30` : 'border-slate-100 bg-white'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left group">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${open ? `bg-${color}-100 text-${color}-600` : 'bg-slate-100 text-slate-400'}`}>
            <Icon size={15} />
          </div>
          <span className="text-sm font-black text-slate-800">{title}</span>
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${open ? 'rotate-180 bg-slate-200' : 'bg-slate-100'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
};

const AnalysisTimelineModal = ({ isOpen, docId, onFinish }) => {
  const [docDetail, setDocDetail] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isOpen && docId) {
      const poll = async () => {
        try {
          const res = await fetch(`${config_env.API_BASE_URL}/documents/${docId}`, { credentials: 'include' });
          const data = await res.json();
          setDocDetail(data);
          if (['Completed', 'Failed', 'Error', 'Failed Validation', 'Processing Error'].includes(data?.status)) {
            clearInterval(interval);
          }
        } catch (err) {
          setError("Connection lost. Polling failed.");
          clearInterval(interval);
        }
      };
      poll();
      interval = setInterval(poll, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const ex = docDetail?.extracted_data || {};
  const isDone = docDetail?.status === 'Completed';
  const isFailed = ['Failed', 'Error', 'Failed Validation', 'Processing Error'].includes(docDetail?.status);

  const steps = [
    { id: 'ocr',  label: 'AI OCR Extraction',       isDone: !!(ex.product_name || ex.shipment_code) },
    { id: 'ship', label: 'Shipment Record Created',  isDone: !!docDetail?.shipment_id },
    { id: 'hsn',  label: 'HSN Classification',       isDone: !!ex.hsn_result },
    { id: 'duty', label: 'Duty & Tax Calculated',    isDone: !!ex.duty_result },
    { id: 'risk', label: 'Risk Assessment Analyzed', isDone: !!ex.risk_result },
  ];

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-300">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Sparkles size={18} className="text-blue-600 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">AI Intelligence Engine</span>
            <h2 className="text-lg font-black text-slate-900 leading-none">
              {isDone ? 'Analysis Complete' : isFailed ? 'Analysis Failed' : 'Analyzing Document...'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDone && (
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(ex, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `shnoor_extracted_${docId}.json`; a.click();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Download Extracted Data
            </button>
          )}
          {isDone && (
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Completed
            </span>
          )}
          <button
            onClick={onFinish}
            className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 rounded-xl transition-all"
            title="Back to Documents"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* File Info */}
        {docDetail && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shrink-0">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{docDetail.filename || `Document #${docId}`}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{docDetail.doc_type || 'Detecting type...'}</p>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Processing Pipeline</p>
          <div className="relative space-y-5">
            <div className="absolute left-[13px] top-5 bottom-5 w-0.5 bg-slate-100" />
            {steps.map((step, i) => {
              const isActive = i === steps.findIndex(s => !s.isDone);
              return (
                <div key={step.id} className="relative flex items-center gap-4">
                  <div className={`z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    step.isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : isActive  ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse'
                    : 'bg-slate-100 text-slate-300'
                  }`}>
                    {step.isDone ? <CheckCircle2 size={13} /> : isActive ? <Zap size={13} /> : <div className="w-1.5 h-1.5 bg-current rounded-full" />}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${step.isDone ? 'text-slate-900' : isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {isActive && !isFailed && <Loader2 size={14} className="animate-spin text-blue-400 ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {isFailed && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Analysis Failed</h3>
            <p className="text-xs text-rose-600 font-medium">{ex.error || 'Unexpected issue during processing.'}</p>
            <button onClick={onFinish} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-rose-700 transition-all">
              Dismiss & Retry
            </button>
          </div>
        )}

        {/* Dropdown Intelligence Sections */}
        {isDone && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Extracted Intelligence</p>

            {/* Consignment Details */}
            <Dropdown title="Consignment Details" icon={Box} color="blue" defaultOpen={true}>
              {[
                { label: 'Product Name',   value: ex.product_name },
                { label: 'Shipment Code',  value: ex.shipment_code },
                { label: 'Quantity',       value: ex.quantity },
                { label: 'Unit',           value: ex.unit },
                { label: 'Origin Country', value: ex.country },
                { label: 'Destination',    value: ex.destination_country },
              ].map(row => row.value && (
                <div key={row.label} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                  <span className="text-xs font-black text-slate-900 text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
            </Dropdown>

            {/* HSN Classification */}
            {ex.hsn_result && (
              <Dropdown title="HSN Classification" icon={Zap} color="amber">
                {[
                  { label: 'HSN Code',       value: ex.hsn_code || ex.hsn_result?.hsn_code },
                  { label: 'Description',    value: ex.hsn_result?.description },
                  { label: 'Confidence',     value: ex.hsn_result?.confidence ? `${(ex.hsn_result.confidence * 100).toFixed(1)}%` : null },
                  { label: 'Model Version',  value: ex.hsn_result?.model_version },
                ].map(row => row.value && (
                  <div key={row.label} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <span className="text-xs font-black text-slate-900 text-right max-w-[60%]">{row.value}</span>
                  </div>
                ))}
              </Dropdown>
            )}

            {/* Duty & Tax */}
            {ex.duty_result && (
              <Dropdown title="Duty & Tax Calculation" icon={DollarSign} color="emerald">
                {[
                  { label: 'Total Cost',       value: ex.duty_result?.total_cost ? `${ex.currency || ''} ${ex.duty_result.total_cost}` : null },
                  { label: 'Basic Duty',       value: ex.duty_result?.basic_duty },
                  { label: 'IGST',             value: ex.duty_result?.igst },
                  { label: 'CESS',             value: ex.duty_result?.cess },
                  { label: 'Exchange Rate',    value: ex.duty_result?.exchange_rate },
                  { label: 'CIF Value',        value: ex.duty_result?.cif_value },
                ].map(row => row.value && (
                  <div key={row.label} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <span className="text-xs font-black text-slate-900 text-right max-w-[60%]">{String(row.value)}</span>
                  </div>
                ))}
              </Dropdown>
            )}

            {/* Risk Assessment */}
            {ex.risk_result && (
              <Dropdown title="Risk Assessment" icon={ShieldCheck} color="rose">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-2 ${
                  ex.risk_result?.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-700'
                  : ex.risk_result?.risk_level === 'High' ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  <ShieldCheck size={12} /> {ex.risk_result?.risk_level} Risk
                </div>
                {[
                  { label: 'Risk Score',  value: ex.risk_result?.risk_score },
                  { label: 'Reason',      value: ex.risk_result?.reason },
                  { label: 'Flags',       value: Array.isArray(ex.risk_result?.flags) ? ex.risk_result.flags.join(', ') : ex.risk_result?.flags },
                ].map(row => row.value && (
                  <div key={row.label} className="py-2 border-b border-slate-100 last:border-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{row.label}</span>
                    <span className="text-xs font-medium text-slate-700 leading-relaxed">{String(row.value)}</span>
                  </div>
                ))}
              </Dropdown>
            )}

            {/* Raw JSON */}
            <Dropdown title="Raw Extracted Data (JSON)" icon={FileJson} color="slate">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(ex, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `analysis_${docId}.json`; a.click();
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download size={11} /> Export JSON
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-x-auto max-h-52 whitespace-pre-wrap">
                {JSON.stringify(ex, null, 2)}
              </pre>
            </Dropdown>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <button
                onClick={() => navigate('/dashboard/shipments')}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group"
              >
                View in Shipment Ledger
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onFinish}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-2 transition-colors"
              >
                ← Back to Document Repository
              </button>
            </div>
          </div>
        )}

        {/* Still processing */}
        {!isDone && !isFailed && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parsing Logistics Schema...</p>
            {docDetail?.shipment_id && (
              <button
                onClick={() => navigate('/dashboard/shipments')}
                className="mt-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
              >
                <Box size={13} /> Shipment Created — View Record
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const DOC_TYPES = ['All', 'Invoice', 'Bill of Lading', 'Certificate', 'Other'];

const StatusBadge = ({ status }) => {
  const config = {
    Completed: { icon: <CheckCircle2 size={10} />, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    Processing: { icon: <Loader2 size={10} className="animate-spin" />, cls: 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' },
    Pending: { icon: <Clock size={10} />, cls: 'bg-slate-50 text-slate-400 border-slate-100' },
    Failed: { icon: <X size={10} />, cls: 'bg-rose-50 text-rose-600 border-rose-100' },
    Error: { icon: <AlertCircle size={10} />, cls: 'bg-rose-50 text-rose-600 border-rose-100' },
    'Failed Validation': { icon: <X size={10} />, cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  };
  const s = config[status] || config.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${s.cls} shadow-sm shadow-black/5`}>
      {s.icon} {status}
    </span>
  );
};

const Documents = () => {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done' | 'error'
  const [uploadMsg, setUploadMsg] = useState('');

  // Modal & Polling State
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(0);
  const perPage = 10;

  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const skip = page * perPage;
      const response = await fetch(`${config_env.API_BASE_URL}/documents/?skip=${skip}&limit=${perPage}`, { credentials: 'include' });
      const data = await response.json();
      setDocs(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const response = await fetch(`${config_env.API_BASE_URL}/documents/${id}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setDocs(docs.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadStatus('uploading');
    setUploadMsg(`Uploading "${file.name}"...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${config_env.API_BASE_URL}/documents/upload`, { method: 'POST', body: formData, credentials: 'include' });
      if (!response.ok) throw new Error(await response.text());
      const resData = await response.json();

      setUploadStatus('done');
      setUploadMsg('✅ Document uploaded!');

      // Open the guided analysis modal
      setActiveAnalysisId(resData.id);
      setIsAnalysisOpen(true);

      fetchDocs();
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (e) {
      setUploadStatus('error');
      setUploadMsg(`❌ Upload failed: ${e.message}`);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const filtered = docs.filter(d => {
    const matchSearch = !search || (d.file_url || '').toLowerCase().includes(search.toLowerCase()) || (d.doc_type || '').toLowerCase().includes(search.toLowerCase());
    const matchType = activeType === 'All' || (d.doc_type || '').toLowerCase().includes(activeType.toLowerCase());
    return matchSearch && matchType;
  });

  if (isAnalysisOpen) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <AnalysisTimelineModal
          isOpen={isAnalysisOpen}
          docId={activeAnalysisId}
          onFinish={() => setIsAnalysisOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Document Intelligence Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Upload shipping documents for AI-powered OCR extraction and HSN classification.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95"
        >
          <FileUp size={16} />
          Upload Document
        </button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => handleUpload(e.target.files?.[0])} />
      </div>

      {/* Upload Status Banner */}
      {uploadStatus && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            uploadStatus === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
          {uploadStatus === 'uploading' && <Loader2 className="animate-spin" size={16} />}
          {uploadStatus === 'done' && <CheckCircle2 size={16} />}
          {uploadStatus === 'error' && <AlertCircle size={16} />}
          {uploadMsg}
          <button onClick={() => setUploadStatus(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-full shadow-sm">
            <Upload size={28} className="text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Drag & drop or click to upload</p>
            <p className="text-xs text-slate-400 font-medium">PDF, PNG, JPG supported • AI will extract HSN codes & duty info automatically</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-100 px-3 py-1.5 rounded-full">
            <Brain size={12} />
            AI OCR Powered
            <Sparkles size={12} />
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {DOC_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >{t}</button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Linked Shipment</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={28} />
                    <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Loading Document Repository...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <FileText size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">No documents found</p>
                      <p className="text-xs text-slate-400">Upload a PDF or image to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                            {doc.file_url ? doc.file_url.split('/').pop() : `Document #${doc.id}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">ID: {doc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        {doc.doc_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-blue-600">
                        {doc.shipment_id ? `#${doc.shipment_id}` : '— Unlinked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={doc.status || 'Pending'} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'Completed' && (
                          <button
                            onClick={() => {
                              setActiveAnalysisId(doc.id);
                              setIsAnalysisOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 rounded-md transition-all tooltip"
                            title="View AI Intelligence Report"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                        {(doc.status === 'Failed' || doc.status === 'Error' || doc.status === 'Failed Validation') && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all tooltip"
                            title="Delete Failed Document"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} visible • Page {page + 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              disabled={docs.length < perPage}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
