import React, { useState, useEffect, useRef } from 'react';
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
  Brain,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnalysisTimelineModal = ({ isOpen, docId, onFinish }) => {
  const [docDetail, setDocDetail] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isOpen && docId) {
      const poll = async () => {
        try {
          const res = await fetch(`http://localhost:8000/documents/${docId}`);
          const data = await res.json();
          setDocDetail(data);
          if (data.status === 'Completed' || data.status === 'Failed' || data.status === 'Error') {
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

  const steps = [
    { id: 'ocr', label: 'AI OCR Extraction', isDone: docDetail?.extracted_data && !docDetail?.extracted_data.error },
    { id: 'ship', label: 'Shipment Record Created', isDone: !!docDetail?.shipment_id },
    { id: 'hsn', label: 'HSN Classification', isDone: docDetail?.extracted_data?.hsn_result },
    { id: 'duty', label: 'Duty & Tax Calculated', isDone: docDetail?.extracted_data?.duty_result },
    { id: 'risk', label: 'Risk Assessment Analyzed', isDone: docDetail?.extracted_data?.risk_result },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles size={20} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence Engine</span>
            </div>
            {docDetail?.status === 'Completed' && (
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Processing Complete</span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 leading-tight">Analyzing Consignment Data...</h2>
            <p className="text-sm text-slate-400 font-medium">Extracting intelligence from your uploaded document.</p>
          </div>

          {/* Timeline */}
          <div className="relative space-y-6 py-4">
             {/* Progress Line */}
             <div className="absolute left-[13px] top-8 bottom-8 w-0.5 bg-slate-100" />
             
             {steps.map((step, i) => (
                <div key={step.id} className="relative flex items-center gap-4 group">
                   <div className={`z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                     step.isDone 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                      : i === steps.findIndex(s => !s.isDone) 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse' 
                        : 'bg-slate-100 text-slate-300'
                   }`}>
                      {step.isDone ? <CheckCircle2 size={14} /> : i === steps.findIndex(s => !s.isDone) ? <Zap size={14} /> : <div className="w-1.5 h-1.5 bg-current rounded-full" />}
                   </div>
                   <span className={`text-sm font-bold transition-colors duration-500 ${step.isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                     {step.label}
                   </span>
                </div>
             ))}
          </div>

          <div className="pt-4 flex flex-col gap-3">
             {docDetail?.status === 'Completed' ? (
                <button 
                  onClick={() => navigate(`/dashboard/shipments`)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group"
                >
                  View Full Analysis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
             ) : (
                <div className="flex flex-col items-center gap-2">
                   <Loader2 className="animate-spin text-blue-600" size={24} />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parsing Logistics Schema...</p>
                </div>
             )}
             
             <button onClick={onFinish} className="text-xs font-bold text-slate-400 hover:text-slate-600 py-2">Close & Continue in Background</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DOC_TYPES = ['All', 'Invoice', 'Bill of Lading', 'Certificate', 'Other'];

const StatusBadge = ({ status }) => {
  const config = {
    Completed: { icon: <CheckCircle2 size={10} />, cls: 'bg-emerald-100 text-emerald-700' },
    Processing: { icon: <Clock size={10} className="animate-spin" />, cls: 'bg-amber-100 text-amber-700 animate-pulse' },
    Pending:    { icon: <AlertCircle size={10} />, cls: 'bg-slate-100 text-slate-600' },
  };
  const s = config[status] || config.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${s.cls}`}>
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
      const response = await fetch(`http://localhost:8000/documents/?skip=${skip}&limit=${perPage}`);
      const data = await response.json();
      setDocs(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [page]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadStatus('uploading');
    setUploadMsg(`Uploading "${file.name}"...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8000/documents/upload', { method: 'POST', body: formData });
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <AnalysisTimelineModal 
        isOpen={isAnalysisOpen} 
        docId={activeAnalysisId} 
        onFinish={() => setIsAnalysisOpen(false)} 
      />
      
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
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
          uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-200 text-blue-700' :
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
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
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
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                    <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-all">
                      <MoreVertical size={16} />
                    </button>
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
