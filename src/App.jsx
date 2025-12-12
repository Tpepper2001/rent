import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, ArrowRight,
  User, CheckCircle, AlertCircle, Loader2, LayoutDashboard, Key, Wallet
} from 'lucide-react';
import './index.css';

// --- 1. SUPABASE SETUP ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. AUTH CONTEXT (The Logic Engine) ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isReady, setIsReady] = useState(false); // CRITICAL: Blocks rendering until checks are done

  useEffect(() => {
    const initAuth = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // 2. Get Role if session exists
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
      }
      
      // 3. App is now ready to render
      setIsReady(true);
    };

    initAuth();

    // Real-time listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role);
      } else {
        setUserRole(null);
      }
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, userRole, isReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- 3. UI COMPONENTS ---

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600 animate-fade-in">
    <Building2 size={48} className="mb-4" />
    <Loader2 size={32} className="animate-spin" />
    <p className="mt-4 text-sm font-medium text-slate-500">Loading PropMaster...</p>
  </div>
);

const Card = ({ title, icon: Icon, children, action, className = "" }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        {Icon && <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Icon size={22} /></div>}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
    <div className="text-slate-600">{children}</div>
  </div>
);

const Button = ({ children, loading, variant = "primary", className, ...props }) => {
  const base = "flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 bg-transparent",
    ghost: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
  };
  
  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <Loader2 size={20} className="animate-spin" /> : children}
    </button>
  );
};

// --- 4. PROTECTED ROUTES WRAPPERS ---

// Redirects to Dashboard if already logged in (prevents accessing Login page)
const PublicOnlyRoute = ({ children }) => {
  const { session, isReady } = useAuth();
  if (!isReady) return <LoadingScreen />;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirects to Login if not logged in
const ProtectedRoute = ({ children }) => {
  const { session, isReady } = useAuth();
  if (!isReady) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

// --- 5. DASHBOARD VIEWS ---

const TenantDashboard = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    supabase.from('maintenance_requests')
      .select('*').eq('tenant_id', session.user.id).order('created_at', {ascending: false})
      .then(({data}) => setRequests(data || []));
  }, []);

  const handleRequest = async () => {
    const desc = prompt("What needs fixing?");
    if (!desc) return;
    const { data } = await supabase.from('maintenance_requests').insert({
      tenant_id: session.user.id, description: desc, status: 'pending'
    }).select();
    if(data) setRequests([data[0], ...requests]);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="My Lease" icon={Home} className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
          <div className="text-indigo-100 mt-2">
            <p className="text-sm opacity-80">Monthly Rent</p>
            <p className="text-4xl font-bold text-white my-2">$1,200</p>
            <div className="flex justify-between items-end mt-4">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Next Due: Oct 1</span>
              <button className="bg-white text-indigo-700 px-5 py-2 rounded-lg font-bold hover:bg-indigo-50 transition">Pay Now</button>
            </div>
          </div>
        </Card>

        <Card title="Maintenance" icon={Wrench} action={<button onClick={handleRequest} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"><PlusCircle size={20}/></button>}>
          <div className="space-y-3 h-40 overflow-y-auto custom-scrollbar pr-2">
            {requests.length === 0 ? <div className="text-center text-slate-400 py-8">No active requests</div> : 
              requests.map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                  <span className="truncate w-2/3 font-medium">{r.description}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${r.status==='pending'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{r.status}</span>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
};

const LandlordDashboard = () => {
  const { session } = useAuth();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    supabase.from('properties').select('*').eq('owner_id', session.user.id).then(({data}) => setProperties(data || []));
  }, []);

  const addProperty = async () => {
    const address = prompt("Property Address:");
    if (!address) return;
    const { data } = await supabase.from('properties').insert({ owner_id: session.user.id, address, price: 0, status: 'vacant' }).select();
    if(data) setProperties([...properties, data[0]]);
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Portfolio</h1>
        <Button onClick={addProperty} className="!py-2 !px-4 text-sm gap-2"><PlusCircle size={16}/> Add Unit</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(p => (
          <Card key={p.id} title="Unit" icon={Home}>
            <h4 className="font-bold text-slate-900 mb-1">{p.address}</h4>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.status==='vacant'?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700'}`}>{p.status}</span>
              <button className="text-sm font-semibold text-indigo-600 hover:underline">Manage</button>
            </div>
          </Card>
        ))}
        {properties.length === 0 && <div className="col-span-full py-12 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-400">No properties found.</div>}
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { userRole, signOut, session } = useAuth();
  
  // Handling the "Role Loading" state specifically for the dashboard
  if (!userRole) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Building2 /> <span className="hidden sm:inline">PropMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {userRole}
            </span>
            <button onClick={signOut} className="text-slate-400 hover:text-rose-600 transition p-2 rounded-full hover:bg-slate-50"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {userRole === 'tenant' && <TenantDashboard />}
        {userRole === 'landlord' && <LandlordDashboard />}
        {userRole === 'company' && <div className="text-center py-20 text-slate-500">Company Dashboard Placeholder</div>}
      </main>
    </div>
  );
};

// --- 6. AUTH PAGE (Unified Login/Register) ---

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tenant', name: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, role, name } = formData;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name, role } }
        });
        if (error) throw error;
        alert("Account created! You can now log in.");
        setIsLogin(true); // Switch to login view smoothly
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 animate-fade-in">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 text-sm">Manage your property seamlessly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="animate-fade-in-up">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Full Name</label>
              <input type="text" required className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase ml-1">Email</label>
            <input type="email" required className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase ml-1">Password</label>
            <input type="password" required className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          {!isLogin && (
            <div className="pt-2 animate-fade-in-up">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-2 block">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {['tenant', 'landlord', 'company'].map(r => (
                  <button type="button" key={r} onClick={() => setFormData({...formData, role: r})}
                    className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${formData.role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button loading={loading} className="w-full mt-6">
            {isLogin ? 'Sign In' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-indigo-600 font-bold hover:underline focus:outline-none">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- 7. MAIN APP ROUTER ---

const App = () => {
  const { isReady } = useAuth();

  // 1. Initial Loading State (Blocks the entire app until Supabase checks session)
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES (Only accessible if logged OUT) */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        } />

        {/* PROTECTED ROUTES (Only accessible if logged IN) */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } />

        {/* DEFAULT REDIRECTS */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

// --- 8. MOUNT ---
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default App;
