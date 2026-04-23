import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Globe, 
  Zap, 
  CheckCircle2, 
  Ship, 
  Search,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import TrackingBanner from '../components/TrackingBanner';
import Chatbot from '../components/Chatbot';

const Home = () => {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass-card z-[100] px-8 py-4 flex items-center justify-between transition-all duration-300">
        <Link to="/" className="flex items-center gap-2 group">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">S</div>
           <span className="font-bold text-xl tracking-tight text-slate-900 uppercase">Shnoor</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <a href="#services" className="hover:text-blue-600 transition-colors relative group">
             Services
             <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
           </a>
           <a href="#tracking" className="hover:text-blue-600 transition-colors relative group">
             Tracking
             <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
           </a>
           <a href="#about" className="hover:text-blue-600 transition-colors relative group">
             About Us
             <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
           </a>
        </div>
        <div className="flex items-center gap-4">
           <Link to="/login" className="text-slate-600 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-colors">
             Login
           </Link>
           <Link to="/register" className="btn-premium px-6 py-2.5">
             Create Account
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-widest shadow-sm">
              <Zap size={14} fill="currentColor" />
              Intelligence Driven Logistics
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.05] tracking-tight">
              Global Trade<br/> 
              <span className="text-blue-600">Simplified.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
              Eliminate friction in your supply chain. AI-driven HSN classification and real-time shipment intelligence built for the modern enterprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <Link to="/login" className="btn-premium px-8 py-4 text-lg group">
                  Enter Command Center
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </Link>
               <a href="#tracking" className="px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-900 font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group tracking-wide">
                  <Search size={20} />
                  Live Track
               </a>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
               <img 
                 src="https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=2070" 
                 alt="Logistics Port" 
                 className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-[2s]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
               <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"><Ship size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Fleet Signal Active</p>
                      <p className="text-sm font-bold">Cargo Hub ALPHA — Connecting Rotterdam</p>
                    </div>
                  </div>
               </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[100px] opacity-10 -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600 rounded-full blur-[100px] opacity-10 -z-10" />
          </div>
        </div>
      </section>

      {/* Tracking Banner Integrated */}
      <div className="px-8 max-w-7xl mx-auto relative z-20">
         <TrackingBanner />
      </div>

      {/* Corporate Features */}
      <section id="services" className="py-24 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
             <h2 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">AI Services</h2>
             <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Advanced tools for the <br/>digital supply chain.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'AI HSN Mapping', 
                desc: 'Predict and verify HSN codes with over 99% accuracy using our multimodal intelligence engine.',
                icon: <Brain size={24}/>
              },
              { 
                title: 'Predictive Tracking', 
                desc: 'Go beyond "where" and know "when". Unified AI visibility across sea, air, and land routes.',
                icon: <Globe size={24}/>
              },
              { 
                title: 'Duty Optimization', 
                desc: 'Automated tax and compliance analysis for high-volume cross-border trade operations.',
                icon: <Shield size={24}/>
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover-lift group overflow-hidden relative">
                <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative z-10">
                  {f.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed relative z-10">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration CTA Section */}
      <section className="py-24 px-8 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
             <Users size={14} />
             Exclusive Employee Access
           </div>
           <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
             Ready to streamline your <br/>logistics workflow?
           </h2>
           <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto">
             Join the internal Shnoor network to access AI-powered HSN mapping, predictive tracking, and enterprise-grade reporting.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
             <Link to="/register" className="bg-white text-blue-600 px-10 py-4 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2 group">
               Create Employee Account
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link to="/login" className="bg-transparent border-2 border-white/30 text-white px-10 py-4 rounded-xl font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
               Sign In
             </Link>
           </div>
           <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
             * Restricted to @shnoor.com email addresses
           </p>
        </div>
      </section>

      {/* About / Company Section */}
      <section id="about" className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">About Shnoor</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Trusted by exporters, importers &amp; freight professionals worldwide.</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Founded in 2018, Shnoor International Logistics Group has been at the forefront of digitalising global trade — serving clients across 60+ countries with AI-first technology built for real-world supply chains.</p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-blue-600 text-white p-10 rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Award size={24} /></div>
              <h4 className="text-2xl font-black">Our Mission</h4>
              <p className="font-medium leading-relaxed opacity-90">To eliminate friction in global trade by combining cutting-edge artificial intelligence with deep domain expertise — empowering businesses of every size to move goods across borders with confidence, speed, and compliance.</p>
            </div>
            <div className="bg-slate-900 text-white p-10 rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><TrendingUp size={24} /></div>
              <h4 className="text-2xl font-black">Our Vision</h4>
              <p className="font-medium leading-relaxed opacity-90">A world where a small business in Mumbai can compete on equal footing with a Fortune 500 enterprise — with AI handling the complexity of customs, documentation, and risk so people can focus on growth.</p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: '6+', label: 'Years in Operation', icon: <Clock size={20}/> },
              { value: '60+', label: 'Countries Served', icon: <Globe size={20}/> },
              { value: '50,000+', label: 'Shipments Processed', icon: <Ship size={20}/> },
              { value: '2,800+', label: 'Enterprise Clients', icon: <Users size={20}/> },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto">{stat.icon}</div>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { title: 'Transparency', desc: 'Every classification, duty estimate, and risk score is fully explainable — no black boxes.' },
              { title: 'Compliance First', desc: 'We are built around the customs and trade regulations of 60+ jurisdictions, updated in real time.' },
              { title: 'Client-Centric', desc: 'Dedicated account managers, 24/7 AI support, and SLA-backed uptime for every plan tier.' },
            ].map((v, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1"><CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" /></div>
                <div>
                  <h5 className="text-lg font-bold text-slate-900 mb-1">{v.title}</h5>
                  <p className="text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10">
            <h4 className="text-xl font-black text-slate-900 mb-6">Get In Touch</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl flex-shrink-0"><MapPin size={20}/></div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Head Office</p>
                  <p className="text-slate-500 font-medium text-sm">Shnoor Tower, Trade City Complex,<br/>Dubai, United Arab Emirates</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl flex-shrink-0"><Phone size={20}/></div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Phone &amp; WhatsApp</p>
                  <p className="text-slate-500 font-medium text-sm">+971 4 123 4567<br/>+971 50 987 6543</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl flex-shrink-0"><Mail size={20}/></div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Email</p>
                  <p className="text-slate-500 font-medium text-sm">info@shnoor.com<br/>support@shnoor.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 px-8 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 border-b border-white/10 pb-12">
           <div className="space-y-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white">S</div>
                 <span className="font-black text-xl text-white uppercase tracking-tight">Shnoor</span>
              </div>
              <p className="text-slate-400 max-w-xs font-medium">Leading the digital transformation of international logistics with AI-first technology.</p>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h5 className="font-bold text-sm uppercase tracking-widest text-blue-400">Company</h5>
                <ul className="space-y-2 text-slate-400 font-medium text-sm">
                  <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#about" className="hover:text-white transition-colors">Global Network</a></li>
                  <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="font-bold text-sm uppercase tracking-widest text-blue-400">Legal</h5>
                <ul className="space-y-2 text-slate-400 font-medium text-sm">
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie Settings</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="font-bold text-sm uppercase tracking-widest text-blue-400">Contact</h5>
                <ul className="space-y-2 text-slate-400 font-medium text-sm">
                  <li><a href="mailto:info@shnoor.com" className="hover:text-white transition-colors">info@shnoor.com</a></li>
                  <li><a href="mailto:support@shnoor.com" className="hover:text-white transition-colors">support@shnoor.com</a></li>
                  <li><span className="text-slate-500">+971 4 123 4567</span></li>
                </ul>
              </div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
           <p>© 2026 Shnoor International Logistics Group. All rights reserved.</p>
           <div className="flex items-center gap-6">
             <a href="#" className="hover:text-white transition-colors">Twitter</a>
             <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
           </div>
        </div>
      </footer>

      {/* Floating Chatbot Integrated */}
      <Chatbot />
    </div>
  );
};

// Simple Fallback Icon for Brain
const Brain = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/>
  </svg>
);

export default Home;
