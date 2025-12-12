import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, ArrowRight,
  User, CheckCircle, AlertCircle, Shield, Key, Wallet, LayoutGrid
} from 'lucide-react';
import './index.css';

// --- 1. SUPABASE CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';

if (!supabaseUrl || !supabaseKey) console.error("Missing Supabase Env Variables");

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. AUTH CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setUserRole(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) setUserRole(data.role);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, userRole, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- 3. SHARED UI COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-red-600 hover:bg-red-50"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ title, subtitle, icon: Icon, children, action, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="text-slate-600">{children}</div>
  </div>
);

const Badge = ({ children, type = 'neutral' }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    error: "bg-rose-50 text-rose-700 border border-rose-100",
    info: "bg-blue-50 text-blue-700 border border-blue-100"
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${styles[type]}`}>{children}</span>;
};

// --- 4. LANDING PAGE ---

const LandingPage = () => {
  const { session } = useAuth();

  if (session) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 text-2xl font-black tracking-tight">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Building2 size={24} />
            </div>
            <span>PropMaster</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login"><Button variant="ghost">Log In</Button></Link>
            <Link to="/register"><Button variant="primary">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            The #1 Platform for Modern Housing
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Property Management <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Reimagined.
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Seamlessly connect landlords, tenants, and real estate companies. Handle rent, maintenance, and analytics in one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button className="h-14 px-8 text-lg">Start for Free <ArrowRight size={20}/></Button>
            </Link>
            <Button variant="secondary" className="h-14 px-8 text-lg">View Demo</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <Card title="For Tenants" subtitle="Live better" icon={User} className="bg-slate-50 border-none">
              <ul className="space-y-3 mt-2">
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-emerald-500"/> One-click rent payments</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-emerald-500"/> Instant maintenance requests</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-emerald-500"/> Digital lease agreements</li>
              </ul>
            </Card>
            <Card title="For Landlords" subtitle="Manage smarter" icon={Key} className="bg-slate-50 border-none">
              <ul className="space-y-3 mt-2">
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-indigo-500"/> Automated rent collection</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-indigo-500"/> Tenant screening tools</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-indigo-500"/> Expense tracking</li>
              </ul>
            </Card>
            <Card title="For Companies" subtitle="Scale faster" icon={LayoutGrid} className="bg-slate-50 border-none">
              <ul className="space-y-3 mt-2">
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-violet-500"/> Multi-property analytics</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-violet-500"/> Team role management</li>
                <li className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-violet-500"/> API Integration</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>&copy; 2024 PropMaster Inc. Built with React & Supabase.</p>
      </footer>
    </div>
  );
};

// --- 5. DASHBOARD COMPONENTS ---

const DashboardLayout = () => {
  const { session, userRole, signOut } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <Building2 /> <span className="hidden sm:inline">PropMaster</span>
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {userRole} Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700">{session?.user?.email}</span>
            </div>
            <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-rose-600">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

const TenantDashboard = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    supabase.from('maintenance_requests')
      .select('*').eq('tenant_id', session.user.id).order('created_at', {ascending: false})
      .then(({data}) => setRequests(data || []));
  }, [session]);

  const addRequest = async () => {
    const desc = prompt("What needs fixing?");
    if (!desc) return;
    const { data } = await supabase.from('maintenance_requests').insert({
      tenant_id: session.user.id, description: desc, status: 'pending'
    }).select();
    if(data) setRequests([data[0], ...requests]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Current Lease" icon={Home} className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
          <div className="mt-2 text-indigo-100">
            <p className="text-sm opacity-80">Monthly Rent</p>
            <p className="text-4xl font-bold text-white mt-1 mb-4">$1,250<span className="text-lg font-normal opacity-70">.00</span></p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm opacity-80">Next Due Date</p>
                <p className="font-semibold">Oct 1st, 2025</p>
              </div>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-50 transition">
                Pay Now
              </button>
            </div>
          </div>
        </Card>

        <Card title="Maintenance" icon={Wrench} 
          action={<Button variant="outline" onClick={addRequest} className="!px-2 !py-1 text-xs"><PlusCircle size={14}/> New</Button>}>
          <div className="h-48 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {requests.length === 0 && <div className="text-center text-slate-400 py-10">No active requests</div>}
            {requests.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700 truncate w-3/4">{r.description}</span>
                <Badge type={r.status === 'pending' ? 'warning' : 'success'}>{r.status}</Badge>
              </div>
            ))}
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
    supabase.from('properties').select('*').eq('owner_id', session.user.id)
      .then(({data}) => setProperties(data || []));
  }, [session]);

  const addProperty = async () => {
    const address = prompt("Address:");
    if (!address) return;
    const { data } = await supabase.from('properties').insert({
      owner_id: session.user.id, address, price: 1500, status: 'vacant'
    }).select();
    if (data) setProperties([...properties, data[0]]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Properties</h2>
        <Button onClick={addProperty}><PlusCircle size={18}/> Add Property</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(p => (
          <Card key={p.id} title="Apartment Unit" icon={Home}>
            <div className="mb-4">
              <h4 className="text-lg font-bold text-slate-800">{p.address}</h4>
              <p className="text-slate-500 text-sm mt-1">${p.price}/month</p>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <Badge type={p.status === 'vacant' ? 'error' : 'success'}>{p.status}</Badge>
              <button className="text-indigo-600 text-sm font-semibold hover:underline">Manage</button>
            </div>
          </Card>
        ))}
        {properties.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
            <Home size={48} className="mx-auto text-slate-300 mb-4"/>
            <p className="text-slate-500">No properties yet.</p>
            <button onClick={addProperty} className="text-indigo-600 font-bold mt-2 hover:underline">Add your first one</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 6. AUTH PAGE (Login/Register) ---

const AuthPage = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tenant', name: '' });
  const isRegister = type === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, role, name } = formData;
    
    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name, role } }
      });
      if (error) alert(error.message); else alert("Check your email!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
        
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-50 rounded-2xl text-indigo-600 mb-4">
            <Building2 size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{isRegister ? 'Join PropMaster' : 'Welcome Back'}</h2>
          <p className="text-slate-500 mt-2">{isRegister ? 'Manage your property journey' : 'Enter your details to access'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <input type="text" placeholder="Full Name" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              onChange={e => setFormData({...formData, name: e.target.value})} />
          )}
          <input type="email" placeholder="Email Address" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            onChange={e => setFormData({...formData, password: e.target.value})} />

          {isRegister && (
            <div className="grid grid-cols-3 gap-2">
              {['tenant', 'landlord', 'company'].map(r => (
                <button type="button" key={r} onClick={() => setFormData({...formData, role: r})}
                  className={`py-2 px-1 text-xs font-bold uppercase rounded-lg border transition-all ${formData.role === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                  {r}
                </button>
              ))}
            </div>
          )}

          <Button className="w-full py-4 text-lg shadow-indigo-200" disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <p className="text-center mt-8 text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <Link to={isRegister ? '/login' : '/register'} className="ml-2 text-indigo-600 font-bold hover:text-indigo-700">
            {isRegister ? 'Login' : 'Sign Up'}
          </Link>
        </p>
      </div>
    </div>
  );
};

// --- 7. ROUTING ---

const RoleRedirect = () => {
  const { userRole } = useAuth();
  if (!userRole) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Dashboard...</div>;
  if (userRole === 'tenant') return <TenantDashboard />;
  if (userRole === 'landlord') return <LandlordDashboard />;
  return <div className="p-8 text-center text-slate-500">Company Dashboard Placeholder</div>;
};

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage type="login" />} />
        <Route path="/register" element={<AuthPage type="register" />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<RoleRedirect />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </AuthProvider>
);

// --- 8. MOUNT ---
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
}

export default App;
