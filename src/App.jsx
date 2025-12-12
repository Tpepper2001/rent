import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, X,
  User, CheckCircle, AlertCircle, Loader2, Mail, Lock, AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import './index.css';

// --- 1. CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase keys missing. Check .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // This setting prevents the client from automatically crashing on bad tokens
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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

// --- 3. AUTH CONTEXT (ROBUST VERSION) ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Get Session safely
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
           throw error;
        }

        if (session) {
          setSession(session);
          // 2. Fetch Role
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn("Profile check failed, likely deleted user.");
            // If profile is gone, force logout to clear bad state
            await supabase.auth.signOut();
            setSession(null);
          } else if (data) {
            setUserRole(data.role);
          }
        }
      } catch (err) {
        console.error("Auth Error:", err.message);
        // CRITICAL FIX: If token is bad, clear it so we can see the Login Screen
        if (err.message.includes("Refresh Token") || err.message.includes("Bad Request")) {
           await supabase.auth.signOut();
           setSession(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listener for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserRole(null);
        setLoading(false);
      } else if (session) {
        setSession(session);
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

const Button = ({ children, isLoading, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    disabled={isLoading}
    className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex justify-center items-center gap-2 disabled:opacity-70 ${className}`}
  >
    {isLoading ? <Spinner /> : children}
  </button>
);

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" {...props} />
  </div>
);

// --- 5. DASHBOARD VIEWS ---

const TenantView = ({ session }) => {
  const [requests, setRequests] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.from('maintenance_requests').select('*').eq('tenant_id', session.user.id)
      .then(({data}) => setRequests(data || []));
  }, []);

  const handleRequest = async () => {
    const desc = prompt("What needs fixing?");
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Welcome Home</h2>
        <p className="opacity-90">Tenant Portal</p>
        <div className="mt-6 flex gap-3">
          <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm">Pay Rent</button>
          <button onClick={handleRequest} className="bg-indigo-500/30 text-white px-4 py-2 rounded-lg font-bold text-sm border border-white/20">Request Fix</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wrench size={20}/> Maintenance</h3>
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="flex justify-between p-3 bg-slate-50 rounded-lg text-sm">
              <span>{r.description}</span>
              <span className="font-bold text-amber-600 uppercase text-xs">{r.status}</span>
            </div>
          ))}
          {requests.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No active requests.</p>}
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
    const addr = prompt("Address:");
    if(!addr) return;
    const { data, error } = await supabase.from('properties').insert({ owner_id: session.user.id, address: addr }).select();
    if(error) addToast('error', error.message);
    else {
      setProps([...props, data[0]]);
      addToast('success', 'Property Added');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
       <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Portfolio</h2>
          <p className="text-slate-500 text-sm">Manage your units</p>
        </div>
        <button onClick={addProp} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <PlusCircle size={16}/> Add Unit
        </button>
       </div>
       
       <div className="grid md:grid-cols-2 gap-4">
         {props.map(p => (
           <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
             <div className="flex justify-between items-start">
               <div className="font-bold text-slate-800">{p.address}</div>
               <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase">{p.status}</span>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

// --- 6. AUTH SCREEN (LANDING PAGE) ---
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
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
        addToast('success', 'Account created! Check email or sign in.');
      }
    } catch(err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-50 rounded-2xl text-indigo-600 mb-4"><Building2 size={32}/></div>
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Get Started'}</h1>
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

          <Button isLoading={loading} className="mt-4">{isLogin ? 'Sign In' : 'Create Account'}</Button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          {isLogin ? 'New here?' : 'Have an account?'} 
          <button onClick={()=>setIsLogin(!isLogin)} className="text-indigo-600 font-bold ml-2 hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- 7. APP LAYOUT ---
const AppLayout = () => {
  const { session, userRole, loading, signOut } = useAuth();

  // EMERGENCY RESET BUTTON (If stuck loading)
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Spinner />
      <p className="text-slate-500 text-sm mt-4 mb-8">Connecting...</p>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 border border-slate-200 px-3 py-1 rounded-full">
        <RefreshCw size={12}/> Reset Cache
      </button>
    </div>
  );

  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-xl text-indigo-600 flex items-center gap-2"><Building2/> PropMaster</div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-500">{userRole}</span>
          <button onClick={signOut} className="text-slate-400 hover:text-red-600"><LogOut size={20}/></button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {userRole === 'tenant' && <TenantView session={session} />}
        {userRole === 'landlord' && <LandlordView session={session} />}
        {userRole === 'company' && <div className="text-center text-slate-400 mt-20">Company Dashboard Placeholder</div>}
      </main>
    </div>
  );
};

// --- 8. MOUNT ---
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
