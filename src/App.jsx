import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Search, Plus, MapPin, DollarSign, 
  BedDouble, Bath, Wifi, ArrowRight, User, Loader2, Key, Star, Filter, X
} from 'lucide-react';
import './index.css';

// --- CONFIG ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILS ---
// Generates a random realistic house image if none provided
const getRandomImage = (id) => `https://images.unsplash.com/photo-${id % 2 === 0 ? '1600596542815-a479a8759fb2' : '1512917774080-9991f1c4c750'}?auto=format&fit=crop&w=800&q=80`;

// --- TOAST CONTEXT ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-in backdrop-blur-xl
            ${t.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>
            <span className="font-medium">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => useContext(ToastContext);

// --- AUTH CONTEXT ---
const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
      }
      setLoading(false);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, userRole, loading, signOut: () => supabase.auth.signOut() }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- UI COMPONENTS ---
const Badge = ({ children, color = "indigo" }) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-${color}-100 text-${color}-700`}>{children}</span>
);

// --- TENANT VIEWS ---

// 1. Marketplace (Search Mode)
const Marketplace = ({ session, onSuccess }) => {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    // Fetch only vacant properties (tenant_id is null)
    supabase.from('properties').select('*').is('tenant_id', null)
      .then(({ data }) => setProperties(data || []));
  }, []);

  const handleRent = async (propertyId) => {
    if(!confirm("Are you sure you want to rent this property?")) return;
    
    // Assign property to current user
    const { error } = await supabase.from('properties')
      .update({ tenant_id: session.user.id, status: 'occupied' })
      .eq('id', propertyId);

    if (error) addToast('error', error.message);
    else {
      addToast('success', 'Congratulations! You have a new home.');
      onSuccess(); // Refresh parent to show "My Apartment"
    }
  };

  const filtered = properties.filter(p => 
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Find your sanctuary.</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Browse our curated list of available properties. Filter by location, price, or vibe.</p>
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition"><Search size={20}/></div>
          <input 
            type="text" 
            placeholder="Search 'Modern loft', 'New York', or description..." 
            className="w-full pl-12 pr-6 py-4 rounded-full border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition text-lg"
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((p, idx) => (
          <div key={p.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            {/* Image Section */}
            <div className="h-64 overflow-hidden relative">
              <img src={p.image_url || getRandomImage(idx)} alt="Home" className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                ${p.price}<span className="text-slate-500 font-normal">/mo</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{p.title || "Modern Apartment"}</h3>
                <div className="flex gap-1 text-slate-400">
                   <Star size={14} className="text-amber-400 fill-amber-400"/> 4.8
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                <MapPin size={14}/> {p.address}
              </div>

              <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                {p.description || "A beautiful space waiting for you. Features modern amenities, great lighting, and a prime location."}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 border-t border-slate-50 pt-4">
                <span className="flex items-center gap-1"><BedDouble size={14}/> 2 Bed</span>
                <span className="flex items-center gap-1"><Bath size={14}/> 2 Bath</span>
                <span className="flex items-center gap-1"><Wifi size={14}/> Fast Wifi</span>
              </div>

              <button 
                onClick={() => handleRent(p.id)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition shadow-lg shadow-slate-200"
              >
                Rent this Property
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Filter size={48} className="mx-auto mb-4 opacity-20"/>
            <p>No properties found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. My Apartment (Active Mode)
const MyApartment = ({ session, myProperty }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100">
        <div className="h-64 md:h-80 relative">
          <img src={myProperty.image_url || getRandomImage(1)} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{myProperty.title || "My Sweet Home"}</h1>
              <p className="text-white/80 flex items-center gap-2"><MapPin size={18}/> {myProperty.address}</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">About your home</h3>
              <p className="text-slate-600 leading-relaxed">{myProperty.description || "No description provided by landlord."}</p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Key size={18}/> Lease Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Monthly Rent</p>
                  <p className="font-bold text-lg">${myProperty.price}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
                <div>
                  <p className="text-slate-400">Landlord</p>
                  <p className="font-medium">Direct Contact</p>
                </div>
                <div>
                  <p className="text-slate-400">Next Payment</p>
                  <p className="font-medium">Oct 1st</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">
              Pay Rent
            </button>
            <button className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition">
              Report Issue
            </button>
            <button className="w-full py-4 bg-white border border-slate-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition">
              End Lease
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TenantController = ({ session }) => {
  const [myProperty, setMyProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    supabase.from('properties').select('*').eq('tenant_id', session.user.id).single()
      .then(({ data }) => {
        setMyProperty(data);
        setLoading(false);
      });
  };

  useEffect(fetchStatus, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return myProperty 
    ? <MyApartment session={session} myProperty={myProperty} />
    : <Marketplace session={session} onSuccess={fetchStatus} />;
};

// --- LANDLORD VIEWS ---

const LandlordController = ({ session }) => {
  const [properties, setProperties] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const { addToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({ title: '', address: '', price: '', description: '' });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = () => {
    supabase.from('properties').select('*').eq('owner_id', session.user.id)
      .then(({ data }) => setProperties(data || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('properties').insert({
      owner_id: session.user.id,
      title: formData.title,
      address: formData.address,
      price: formData.price,
      description: formData.description,
      status: 'vacant'
    });

    if (error) addToast('error', error.message);
    else {
      addToast('success', 'Property Listed Successfully');
      setIsAdding(false);
      fetchProperties();
      setFormData({ title: '', address: '', price: '', description: '' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Landlord Portal</h1>
          <p className="text-slate-500">Manage your listings and tenants</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition flex items-center gap-2 shadow-lg"
        >
          {isAdding ? <X size={20}/> : <Plus size={20}/>} {isAdding ? 'Cancel' : 'List Property'}
        </button>
      </div>

      {/* Add Property Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-slide-in">
          <h2 className="text-xl font-bold mb-6 text-indigo-600">List a new property</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Property Title</label>
              <input 
                placeholder="e.g. Sunny Downtown Loft" 
                className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Address</label>
              <input placeholder="123 Main St" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setFormData({...formData, address: e.target.value})} required/>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Monthly Rent ($)</label>
              <input type="number" placeholder="1500" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setFormData({...formData, price: e.target.value})} required/>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500 ml-1">Detailed Description</label>
              <textarea 
                placeholder="Describe the amenities, the view, the neighborhood..." 
                className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">Publish Listing</button>
            </div>
          </form>
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="font-bold text-lg text-slate-900 line-clamp-1">{p.title || p.address}</div>
              <Badge color={p.tenant_id ? "rose" : "emerald"}>{p.tenant_id ? "Occupied" : "Vacant"}</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description || "No description provided."}</p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="font-bold text-slate-900">${p.price}/mo</span>
              <button className="text-indigo-600 text-sm font-bold hover:underline">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- APP LAYOUT ---
const App = () => {
  const { session, userRole, loading, signOut } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;

  if (!session) {
    // Basic Auth Redirect (Simplified for brevity as user has Auth code already)
    return <div className="h-screen flex items-center justify-center text-slate-500">Please Log In (Use previous Auth Screen)</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <nav className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tight">
            <Building2 size={24}/> PropMaster
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase text-slate-500">{userRole}</span>
            <button onClick={signOut} className="text-slate-400 hover:text-rose-500 transition"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {userRole === 'tenant' && <TenantController session={session} />}
        {userRole === 'landlord' && <LandlordController session={session} />}
      </main>
    </div>
  );
};

// --- MOUNT ---
const root = document.getElementById('root');
if(root) createRoot(root).render(<React.StrictMode><ToastProvider><AuthProvider><App/></AuthProvider></ToastProvider></React.StrictMode>);

export default App;
