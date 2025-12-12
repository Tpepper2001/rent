import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, X, ArrowLeft,
  User, CheckCircle, AlertCircle, Loader2, Mail, Lock, Key, ArrowRight, LayoutGrid, Shield
} from 'lucide-react';
import './index.css';

// --- 1. CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase keys missing. Check .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. TOAST CONTEXT ---
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in min-w-[300px] backdrop-blur-md bg-white/95
            ${t.type === 'error' ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'}`}>
            {t.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-auto opacity-50 hover:opacity-100"><X size={16}/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
const useToast = () => useContext(ToastContext);

// --- 3. AUTH CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          const { data, error: profileError } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
          
          if (profileError) {
            // Safety: If profile missing, logout to prevent stuck state
            await supabase.auth.signOut();
            setSession(null);
          } else if (data) {
            setUserRole(data.role);
          }
        }
      } catch (err) {
        console.error(err);
        // Safety: Clear session on bad token
        if (err.message.includes("Refresh Token")) {
           await supabase.auth.signOut();
           setSession(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

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

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- 4. UI COMPONENTS ---

const Spinner = () => <Loader2 className="animate-spin text-indigo-600" size={24} />;

const Button = ({ children, isLoading, onClick, variant = 'primary', className = "" }) => {
  const base = "py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return (
    <button onClick={onClick} disabled={isLoading} className={`${base} ${styles[variant]} ${className}`}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" {...props} />
  </div>
);

// --- 5. LANDING PAGE (NEW) ---

const LandingPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-white">
    {/* Header */}
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Building2 size={24}/> <span>PropMaster</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => onNavigate('login')}>Log In</Button>
          <Button variant="primary" onClick={() => onNavigate('register')}>Get Started</Button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
        </span>
        The Future of Property Management
      </div>
      <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8">
        Manage properties <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">without the headache.</span>
      </h1>
      <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
        Connect landlords, tenants, and real estate companies in one seamless platform. Automated rent, maintenance tracking, and portfolio analytics.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => onNavigate('register')} className="h-14 px-8 text-lg">
          Start for Free <ArrowRight size={20}/>
        </Button>
        <Button variant="secondary" onClick={() => onNavigate('login')} className="h-14 px-8 text-lg">
          View Demo
        </Button>
      </div>
    </section>

    {/* Features Grid */}
    <section className="bg-slate-50 py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {[
          { icon: User, title: 'For Tenants', desc: 'Pay rent online and request maintenance in seconds.' },
          { icon: Key, title: 'For Landlords', desc: 'Screen tenants, track payments, and manage units.' },
          { icon: LayoutGrid, title: 'For Companies', desc: 'Scale your portfolio with enterprise-grade tools.' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <item.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

// --- 6. AUTH SCREEN (Login/Register) ---

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
        setIsLogin(true); // Switch to login after register
      }
    } catch(err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mb-8 mt-2">
          <div className="inline-block p-3 bg-indigo-50 rounded-2xl text-indigo-600 mb-4"><Building2 size={32}/></div>
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <Input label="Full Name" onChange={e=>setFormData({...formData, name:e.target.value})} required />}
          <Input label="Email" type="email" onChange={e=>setFormData({...formData, email:e.target.value})} required />
          <Input label="Password" type="password" onChange={e=>setFormData({...formData, password:e.target.value})} required />
          
          {!isLogin && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['tenant','landlord','company'].map(r => (
                <button type="button" key={r} onClick={()=>setFormData({...formData, role:r})}
                  className={`py-2 text-xs font-bold uppercase rounded-lg border transition ${formData.role===r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                  {r}
                </button>
              ))}
            </div>
          )}

          <Button isLoading={loading} className="w-full mt-4">{isLogin ? 'Sign In' : 'Sign Up'}</Button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? 'New here?' : 'Have an account?'} 
          <button onClick={()=>setIsLogin(!isLogin)} className="text-indigo-600 font-bold ml-2 hover:underline">
            {isLogin ? 'Create Account' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- 7. DASHBOARD COMPONENTS ---

const TenantView = ({ session }) => {
  const [requests, setRequests] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.from('maintenance_requests').select('*').eq('tenant_id', session.user.id)
      .then(({data}) => setRequests(data || []));
  }, []);

  const handleRequest = async () => {
    const desc = prompt("Describe the issue:");
    if (!desc) return;
    const { data, error } = await supabase.from('maintenance_requests').insert({
      tenant_id: session.user.id, description: desc
    }).select();
    if (error) addToast('error', error.message);
    else {
      setRequests([data[0], ...requests]);
      addToast('success', 'Request Sent');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Welcome Home</h2>
        <p className="opacity-90 mb-6">Your rental overview</p>
        <div className="flex gap-3">
          <button className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition">Pay Rent</button>
          <button onClick={handleRequest} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition">Request Maintenance</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Wrench size={20}/> Maintenance History</h3>
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">{r.description}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.status}</span>
            </div>
          ))}
          {requests.length === 0 && <p className="text-slate-400 text-center py-8">No active requests.</p>}
        </div>
      </div>
    </div>
  );
};

const LandlordView = ({ session }) => {
  const [props, setProps] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.from('properties').select('*').eq('owner_id', session.user.id)
      .then(({data}) => setProps(data || []));
  }, []);

  const addProp = async () => {
    const addr = prompt("Property Address:");
    if(!addr) return;
    const { data, error } = await supabase.from('properties').insert({ owner_id: session.user.id, address: addr }).select();
    if(error) addToast('error', error.message);
    else {
      setProps([...props, data[0]]);
      addToast('success', 'Unit Added');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
       <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Portfolio</h2>
          <p className="text-slate-500">Manage your rental units</p>
        </div>
        <Button onClick={addProp} className="py-2.5 text-sm"><PlusCircle size={18}/> Add Unit</Button>
       </div>
       
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {props.map(p => (
           <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                 <Home size={24}/>
               </div>
               <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">{p.status}</span>
             </div>
             <div className="font-bold text-lg text-slate-900">{p.address}</div>
             <p className="text-slate-500 text-sm mt-1">Managed Unit</p>
           </div>
         ))}
         {props.length === 0 && (
           <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
             <p className="text-slate-400">No properties yet.</p>
           </div>
         )}
       </div>
    </div>
  );
};

// --- 8. MAIN APP LAYOUT (STATE MACHINE) ---

const AppLayout = () => {
  const { session, userRole, loading, signOut } = useAuth();
  // State to handle Landing vs Login vs Register when NOT logged in
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register'

  // 1. Loading
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Spinner />
      <p className="text-slate-400 text-sm mt-4">Loading PropMaster...</p>
      {/* Emergency Reset if stuck */}
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-xs text-slate-300 hover:text-red-500 underline">
        Reset App Cache
      </button>
    </div>
  );

  // 2. Unauthenticated: Show Landing OR Auth Screen based on 'view' state
  if (!session) {
    if (view === 'landing') {
      return <LandingPage onNavigate={setView} />;
    }
    return <AuthScreen initialView={view} onBack={() => setView('landing')} />;
  }

  // 3. Authenticated: Show Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-xl text-indigo-600 flex items-center gap-2"><Building2/> PropMaster</div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-500">{userRole}</span>
          <button onClick={signOut} className="text-slate-400 hover:text-red-600 transition"><LogOut size={20}/></button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!userRole ? <div className="text-center py-10"><Spinner/></div> : 
          <>
            {userRole === 'tenant' && <TenantView session={session} />}
            {userRole === 'landlord' && <LandlordView session={session} />}
            {userRole === 'company' && <div className="text-center text-slate-400 mt-20">Company Dashboard Placeholder</div>}
          </>
        }
      </main>
    </div>
  );
};

// --- 9. MOUNT ---
const root = document.getElementById('root');
if(root) {
  createRoot(root).render(
    <React.StrictMode>
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}

export default AppLayout;
