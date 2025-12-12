import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, X,
  User, CheckCircle, AlertCircle, Loader2, Mail, Lock, AlertTriangle, Info
} from 'lucide-react';
import './index.css';

// --- 1. CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. TOAST CONTEXT (Notification System) ---
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000); // Auto dismiss
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in min-w-[300px] backdrop-blur-md
            ${t.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' : 
              t.type === 'error' ? 'bg-rose-50/90 border-rose-200 text-rose-800' : 
              'bg-blue-50/90 border-blue-200 text-blue-800'}`}>
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'error' && <AlertTriangle size={18} />}
            {t.type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100"><X size={16}/></button>
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
  const { addToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) await fetchRole(session.user.id);
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) await fetchRole(session.user.id);
      else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (error) throw error;
      if (data) setUserRole(data.role);
    } catch (err) {
      console.error("Fetch Role Error:", err);
      // Don't show toast here to avoid spamming on load, just log it
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    addToast('info', 'Successfully logged out');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- 4. SHARED UI COMPONENTS ---

const Spinner = ({ size = 20, className = "" }) => <Loader2 size={size} className={`animate-spin ${className}`} />;

const Button = ({ children, isLoading, variant = 'primary', className = '', ...props }) => {
  const base = "relative overflow-hidden flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100"
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

const Input = ({ label, error, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      <input 
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${error ? 'input-error' : ''}`}
        {...props} 
      />
    </div>
    {error && <p className="text-xs text-rose-500 font-medium ml-1 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
  </div>
);

const Card = ({ title, icon: Icon, children, action, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        {Icon && <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Icon size={22}/></div>}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// --- 5. DASHBOARD COMPONENTS ---

const EmptyState = ({ message, action }) => (
  <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
    <div className="bg-slate-100 p-4 rounded-full mb-3 text-slate-400"><Home size={32}/></div>
    <p className="text-slate-500 font-medium mb-4">{message}</p>
    {action}
  </div>
);

const TenantView = ({ session }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase.from('maintenance_requests')
        .select('*').eq('tenant_id', session.user.id).order('created_at', {ascending: false});
      setRequests(data || []);
    } catch (e) { addToast('error', 'Failed to load requests'); }
    finally { setLoading(false); }
  };

  const handleRequest = async () => {
    const desc = prompt("What's the issue?"); // In a real app, use a proper modal
    if (!desc) return;
    
    try {
      const { data, error } = await supabase.from('maintenance_requests')
        .insert({ tenant_id: session.user.id, description: desc, status: 'pending' }).select();
      
      if (error) throw error;
      setRequests([data[0], ...requests]);
      addToast('success', 'Request submitted successfully');
    } catch (e) { addToast('error', e.message); }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size={40} className="text-indigo-600"/></div>;

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-slide-in">
      <Card title="Current Lease" icon={Home} className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
        <div className="mt-2 text-indigo-100">
          <p className="text-sm opacity-80">Monthly Rent</p>
          <p className="text-4xl font-bold text-white mt-1 mb-6">$1,200</p>
          <Button variant="secondary" className="w-full text-indigo-700 border-none shadow-lg">Pay Now</Button>
        </div>
      </Card>

      <Card title="Maintenance" icon={Wrench} action={<button onClick={handleRequest} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"><PlusCircle size={20}/></button>}>
        <div className="space-y-3 h-48 overflow-y-auto custom-scrollbar pr-2">
          {requests.length === 0 ? <EmptyState message="No active requests" /> : 
            requests.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-700 truncate w-2/3">{r.description}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                  ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {r.status}
                </span>
              </div>
            ))
          }
        </div>
      </Card>
    </div>
  );
};

const LandlordView = ({ session }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.from('properties').select('*').eq('owner_id', session.user.id)
      .then(({ data }) => { setProperties(data || []); setLoading(false); });
  }, []);

  const addProperty = async () => {
    const address = prompt("Property Address:"); // Use modal in production
    if (!address) return;
    
    try {
      const { data, error } = await supabase.from('properties')
        .insert({ owner_id: session.user.id, address, status: 'vacant' }).select();
      
      if (error) throw error;
      setProperties([...properties, data[0]]);
      addToast('success', 'Property added to portfolio');
    } catch (e) { addToast('error', e.message); }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size={40} className="text-indigo-600"/></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Portfolio</h2>
        <Button onClick={addProperty} className="!py-2.5 text-sm gap-2"><PlusCircle size={18}/> Add Unit</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length === 0 ? <div className="col-span-full"><EmptyState message="You haven't added any properties yet." /></div> : 
          properties.map(p => (
            <Card key={p.id} title="Apartment Unit" icon={Home}>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{p.address}</h4>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                  ${p.status === 'vacant' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {p.status}
                </span>
                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Manage</button>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

// --- 6. AUTH SCREEN (Login/Register) ---

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tenant', name: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Invalid email address";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!isLogin && !formData.name) newErrors.name = "Full name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: formData.email, password: formData.password 
        });
        if (error) throw error;
        addToast('success', 'Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: { data: { full_name: formData.name, role: formData.role } }
        });
        if (error) throw error;
        addToast('success', 'Account created! Signing you in...');
      }
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[420px] glass-panel rounded-3xl p-8 animate-slide-in relative overflow-hidden">
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"/>
        
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your properties with ease</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <Input 
              label="Full Name" icon={User} placeholder="John Doe"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              error={errors.name}
            />
          )}
          
          <Input 
            label="Email" type="email" icon={Mail} placeholder="you@example.com"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            error={errors.email}
          />
          
          <Input 
            label="Password" type="password" icon={Lock} placeholder="••••••••"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            error={errors.password}
          />

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {['tenant', 'landlord', 'company'].map(r => (
                  <button type="button" key={r} onClick={() => setFormData({...formData, role: r})}
                    className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all duration-200
                    ${formData.role === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full mt-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "New here?" : "Already have an account?"}
            <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="ml-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- 7. MAIN APP LAYOUT (No Router) ---

const AppLayout = () => {
  const { session, userRole, loading, signOut } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size={48} className="text-indigo-600 mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Loading PropMaster...</p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!session) {
    return <AuthScreen />;
  }

  // 3. Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Building2 size={24}/> <span className="hidden sm:inline">PropMaster</span>
          </div>
          
          <div className="flex items-center gap-4">
            {userRole && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {userRole}
              </span>
            )}
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button onClick={signOut} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors group">
              <span className="hidden sm:inline">Log Out</span>
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!userRole ? (
          <div className="flex justify-center py-20"><Spinner className="text-indigo-600"/></div>
        ) : (
          <>
            {userRole === 'tenant' && <TenantView session={session} />}
            {userRole === 'landlord' && <LandlordView session={session} />}
            {userRole === 'company' && <div className="text-center text-slate-400 py-20">Company Dashboard Coming Soon</div>}
          </>
        )}
      </main>
    </div>
  );
};

// --- 8. ROOT RENDER ---
const root = document.getElementById('root');
if (root) {
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
