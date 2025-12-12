import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Search, Plus, MapPin, 
  BedDouble, Bath, Wifi, ArrowRight, User, Loader2, Key, Star, Filter, X,
  ShieldCheck, RefreshCw, Phone, Wallet, Menu, Facebook, Twitter, Instagram, Mail
} from 'lucide-react';
import './index.css';

// --- 1. ROBUST CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';

if (!supabaseUrl || !supabaseKey) console.error("CRITICAL: Supabase Keys Missing");

// Enhanced Client with Auto-Recovery
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage // Explicitly bind storage
  }
});

// --- 2. SEO MANAGER ---
const SEOMetadata = ({ title, description }) => {
  useEffect(() => {
    document.title = title;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
  }, [title, description]);
  return null;
};

// --- 3. UTILITIES ---
const formatNaira = (amount) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

const getRandomImage = (id) => {
  const images = [
    '1600596542815-a479a8759fb2', // Modern Villa
    '1512917774080-9991f1c4c750', // Clean Apartment
    '1600607687939-ce8a6c25118c', // Luxury Interior
    '1600585154340-be6161a56a0c', // Bright Living Room
    '1484154218962-a1c002085d2f', // Cozy Flat
    '1545324418-cc1a3fa10c00'     // Studio
  ];
  return `https://images.unsplash.com/photo-${images[id % images.length]}?auto=format&fit=crop&w=800&q=80`;
};

// --- 4. TOAST CONTEXT ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-5 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in backdrop-blur-md text-white
            ${t.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-green-700 border-green-600'}`}>
            <span className="font-medium text-sm">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-70 hover:opacity-100"><X size={16}/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => useContext(ToastContext);

// --- 5. AUTH CONTEXT (THE FIXER) ---
const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // NUCLEAR OPTION: Wipes everything if errors occur
  const nukeCache = async () => {
    console.warn("Nuking Cache...");
    try { await supabase.auth.signOut(); } catch (e) { /* ignore */ }
    localStorage.clear(); // Wipe browser storage
    sessionStorage.clear();
    setSession(null);
    setUserRole(null);
    window.location.href = '/'; // Hard reload
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setSession(session);
          // Fetch Role
          const { data, error: profileError } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
          
          if (profileError) {
             // If user exists but profile missing (DB Trigger failed), reset to fix state
             console.error("Profile missing, resetting...");
             await nukeCache();
          } else if (data) {
            setUserRole(data.role);
          }
        }
      } catch (err) {
        console.error("Auth Init Error:", err.message);
        // Auto-fix invalid tokens
        if (err.message?.includes("Refresh Token") || err.message?.includes("400")) {
          await nukeCache();
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserRole(null);
      } else if (session) {
        setSession(session);
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, userRole, loading, signOut: nukeCache }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- UI COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-green-700 text-white hover:bg-green-800 shadow-lg shadow-green-200",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:border-green-500 hover:text-green-700",
    dark: "bg-slate-900 text-white hover:bg-slate-800"
  };
  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>;
};

// --- NAVIGATION & FOOTER ---
const TopStrip = () => (
  <div className="bg-slate-900 text-slate-300 py-2 px-6 text-xs font-medium flex justify-between items-center relative z-[60]">
    <span className="hidden sm:inline">🇳🇬 Nigeria's Most Trusted Property Platform</span>
    <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end">
      <span>24/7 Support:</span>
      <a href="tel:08102440103" className="flex items-center gap-1 text-white hover:text-green-400 transition font-bold">
        <Phone size={12} className="fill-current"/> 0810 244 0103
      </a>
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 text-white font-bold text-xl mb-4"><Building2/> PropMaster.ng</div>
        <p className="max-w-sm mb-6 leading-relaxed">Simplifying rent and property management across Lagos, Abuja, and Port Harcourt. We connect tenants to homes with zero drama.</p>
        <div className="flex gap-4">
          <Facebook className="hover:text-green-500 cursor-pointer transition"/>
          <Twitter className="hover:text-green-500 cursor-pointer transition"/>
          <Instagram className="hover:text-green-500 cursor-pointer transition"/>
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><a href="#" className="hover:text-green-400">Search Homes</a></li>
          <li><a href="#" className="hover:text-green-400">List Property</a></li>
          <li><a href="#" className="hover:text-green-400">Pay Rent</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4">Contact Center</h4>
        <ul className="space-y-4 text-sm">
          <li className="flex items-center gap-3 text-white">
            <div className="p-2 bg-slate-800 rounded-full"><Phone size={14} className="text-green-500"/></div>
            <a href="tel:08102440103" className="font-bold">0810 244 0103</a>
          </li>
          <li className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-full"><Mail size={14} className="text-green-500"/></div>
            help@propmaster.ng
          </li>
          <li className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-full"><MapPin size={14} className="text-green-500"/></div>
            Lekki Phase 1, Lagos
          </li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-center text-xs opacity-50">
      &copy; 2025 PropMaster Nigeria. All rights reserved.
    </div>
  </footer>
);

// --- LANDING PAGE ---
const LandingPage = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <SEOMetadata title="PropMaster NG | Rent Homes in Nigeria" description="Secure apartments in Lagos & Abuja." />
      <TopStrip />
      
      {/* Sticky Nav */}
      <nav className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700 font-black text-2xl tracking-tighter cursor-pointer" onClick={()=>window.scrollTo(0,0)}>
            <Building2 size={28}/> PropMaster<span className="text-slate-400 text-sm font-normal">.ng</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-medium text-slate-600 hover:text-green-700">Features</a>
            <button onClick={() => onNavigate('login')} className="font-bold text-slate-900 hover:text-green-700">Log In</button>
            <Button variant="primary" onClick={() => onNavigate('register')} className="py-2.5 px-5 text-sm">Get Started</Button>
          </div>
          <button className="md:hidden" onClick={()=>setIsMenuOpen(!isMenuOpen)}>{isMenuOpen?<X/>:<Menu/>}</button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-6 flex flex-col gap-4 animate-fade-in shadow-xl">
             <Button variant="secondary" onClick={() => onNavigate('login')}>Log In</Button>
             <Button variant="primary" onClick={() => onNavigate('register')}>Create Account</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-800 text-sm font-bold mb-8 border border-green-100">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"/> Available in Lagos, Abuja & PH
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-8">
            Find a home.<br/><span className="text-green-700">Skip the Drama.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            We verify every landlord. You pay rent securely. <br/>
            <span className="font-bold text-slate-900">Need help? Call 0810 244 0103.</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => onNavigate('register')} className="h-14 text-lg bg-green-700">Find Apartment</Button>
            <Button variant="secondary" onClick={() => onNavigate('login')} className="h-14 text-lg">Landlord Login</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {icon: ShieldCheck, title: "Verified Listings", desc: "No more fake agents. We verify every property."},
            {icon: Wallet, title: "Monthly Rent", desc: "Flexible payment plans available for verified tenants."},
            {icon: RefreshCw, title: "Instant Repairs", desc: "Report maintenance issues directly in the app."}
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-6"><f.icon size={28}/></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ initialView = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({email:'', password:'', name:'', role:'tenant'});
  const { addToast } = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if(isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
        if(error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: { data: { full_name: formData.name, role: formData.role } }
        });
        if(error) throw error;
        addToast('success', 'Account created! Please Log In.');
        setIsLogin(true);
      }
    } catch(err) { addToast('error', err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900">{isLogin ? 'Welcome Back' : 'Join PropMaster'}</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label><input onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border" required /></div>}
          <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label><input type="email" onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border" required /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label><input type="password" onChange={e=>setFormData({...formData, password:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border" required /></div>
          {!isLogin && <div className="grid grid-cols-3 gap-2 pt-2">{['tenant','landlord','company'].map(r => <button type="button" key={r} onClick={()=>setFormData({...formData, role:r})} className={`py-2 text-xs font-bold uppercase rounded-lg border ${formData.role===r ? 'bg-green-700 text-white' : 'bg-white text-slate-500'}`}>{r}</button>)}</div>}
          <Button className="w-full mt-4 bg-green-700">{loading ? <Loader2 className="animate-spin"/> : (isLogin ? 'Sign In' : 'Create Account')}</Button>
        </form>
        <button onClick={onBack} className="mt-6 text-sm text-slate-400 hover:text-slate-600 w-full text-center">Back to Home</button>
      </div>
    </div>
  );
};

// --- TENANT VIEWS ---
const Marketplace = ({ session, onSuccess }) => {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => { supabase.from('properties').select('*').is('tenant_id', null).then(({ data }) => setProperties(data || [])); }, []);

  const handleRent = async (id) => {
    if(!confirm("Proceed to rent this apartment?")) return;
    const { error } = await supabase.from('properties').update({ tenant_id: session.user.id, status: 'occupied' }).eq('id', id);
    if(error) addToast('error', error.message);
    else { addToast('success', 'Secured! Welcome Home.'); onSuccess(); }
  };

  const filtered = properties.filter(p => (p.title + p.address).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="py-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Find Your Next Home</h1>
        <div className="max-w-md mx-auto relative">
          <input placeholder="Search 'Lekki' or '2 Bed'..." className="w-full p-4 pl-12 rounded-full border shadow-sm outline-none focus:border-green-500" onChange={e => setSearchTerm(e.target.value)} />
          <Search className="absolute left-4 top-4 text-slate-400" size={20}/>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition group">
            <div className="h-56 relative overflow-hidden">
              <img src={p.image_url || getRandomImage(i)} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
              <div className="absolute bottom-3 left-3 bg-white/95 px-3 py-1 rounded-full text-sm font-bold">{formatNaira(p.price)}<span className="text-xs font-normal text-slate-500">/yr</span></div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg truncate">{p.title || "Apartment"}</h3>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-1"><MapPin size={14}/> {p.address}</p>
              <Button onClick={() => handleRent(p.id)} className="w-full py-3 text-sm">Rent Now</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-20 text-slate-400">No homes found.</div>}
      </div>
    </div>
  );
};

const TenantDashboard = ({ session }) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from('properties').select('*').eq('tenant_id', session.user.id).single().then(({ data }) => { setProperty(data); setLoading(false); }); }, []);

  if(loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-green-700"/></div>;
  if(!property) return <Marketplace session={session} onSuccess={() => window.location.reload()} />;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 animate-slide-in">
      <div className="h-64 relative">
        <img src={property.image_url || getRandomImage(1)} className="w-full h-full object-cover"/>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8"><h1 className="text-3xl font-bold text-white">{property.title}</h1></div>
      </div>
      <div className="p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-4">Lease Details</h3>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-2 text-sm">
            <div className="flex justify-between"><span>Rent</span><span className="font-bold">{formatNaira(property.price)}</span></div>
            <div className="flex justify-between"><span>Status</span><span className="font-bold text-green-700">Active</span></div>
          </div>
        </div>
        <div className="space-y-3">
          <Button className="w-full">Make Payment</Button>
          <Button variant="secondary" className="w-full">Report Issue</Button>
        </div>
      </div>
    </div>
  );
};

const LandlordDashboard = ({ session }) => {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', address: '', price: '', description: '' });
  const { addToast } = useToast();

  useEffect(() => { refresh(); }, []);
  const refresh = () => supabase.from('properties').select('*').eq('owner_id', session.user.id).then(({ data }) => setProperties(data || []));
  const handleSubmit = async (e) => { e.preventDefault(); const { error } = await supabase.from('properties').insert({ owner_id: session.user.id, ...formData, status: 'vacant' }); if(error) addToast('error', error.message); else { addToast('success', 'Listed!'); setShowForm(false); refresh(); } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <h1 className="text-3xl font-black text-slate-900">My Portfolio</h1>
         <Button onClick={() => setShowForm(!showForm)} className="bg-slate-900">{showForm?'Cancel':'List Property'}</Button>
      </div>
      {showForm && <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-xl grid md:grid-cols-2 gap-4"><input required className="p-3 bg-slate-50 rounded-lg" placeholder="Title" onChange={e=>setFormData({...formData, title:e.target.value})}/><input required className="p-3 bg-slate-50 rounded-lg" placeholder="Address" onChange={e=>setFormData({...formData, address:e.target.value})}/><input required type="number" className="p-3 bg-slate-50 rounded-lg" placeholder="Rent (₦)" onChange={e=>setFormData({...formData, price:e.target.value})}/><Button className="col-span-2">Publish</Button></form>}
      <div className="grid md:grid-cols-3 gap-6">{properties.map(p => <div key={p.id} className="bg-white p-6 rounded-2xl border shadow-sm"><h3 className="font-bold">{p.title}</h3><p className="text-slate-500">{formatNaira(p.price)}</p></div>)}</div>
    </div>
  );
};

// --- APP ---
const App = () => {
  const { session, userRole, loading, signOut } = useAuth();
  const [view, setView] = useState('landing');

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-green-700 mb-4" size={32}/>
      <p className="text-slate-400 text-sm mb-6">Loading PropMaster...</p>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-2 text-xs text-rose-500 border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-50">
        <RefreshCw size={12}/> Fix App (Reset Cache)
      </button>
    </div>
  );

  if (!session) return view === 'landing' ? <LandingPage onNavigate={setView} /> : <AuthScreen initialView={view} onBack={() => setView('landing')} />;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <TopStrip />
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 text-green-700 font-bold text-xl"><Building2/> PropMaster</div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs font-bold text-slate-500">Support: 0810 244 0103</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase text-slate-500">{userRole}</span>
          <button onClick={signOut} className="text-slate-400 hover:text-rose-600"><LogOut size={20}/></button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!userRole ? <div className="text-center py-20"><Loader2 className="animate-spin inline"/></div> : 
          <>{userRole === 'tenant' && <TenantDashboard session={session} />}{userRole === 'landlord' && <LandlordDashboard session={session} />}{userRole === 'company' && <div>Enterprise Dashboard</div>}</>
        }
      </main>
      <Footer />
    </div>
  );
};

const root = document.getElementById('root');
if(root) createRoot(root).render(<React.StrictMode><ToastProvider><AuthProvider><App/></AuthProvider></ToastProvider></React.StrictMode>);

export default App;
