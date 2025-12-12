import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle,
  User, Loader2, X
} from 'lucide-react';

// --- SUPABASE SETUP ---
const supabaseUrl ='https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TOAST NOTIFICATION SYSTEM ---
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up ${
            toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-emerald-600' : 'bg-indigo-600'
          } text-white min-w-[300px]`}>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="hover:bg-white/20 p-1 rounded">
              <X size={16} />
            </button>
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
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(session);

        if (session) {
          const { data, error: roleError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (roleError) throw roleError;
          if (data) setUserRole(data.role);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        setIsReady(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (data) setUserRole(data.role);
        } catch (error) {
          console.error('Role fetch error:', error);
        }
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
    <AuthContext.Provider value={{ session, userRole, isReady, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- UI COMPONENTS ---
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="relative">
      <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-20 animate-pulse"></div>
      <Building2 size={64} className="mb-6 text-indigo-600 relative z-10" />
    </div>
    <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
    <p className="text-sm font-semibold text-slate-600">Loading PropMaster...</p>
  </div>
);

const Card = ({ title, icon: Icon, children, action, className = "" }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Icon size={22} />
          </div>
        )}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
    <div className="text-slate-600">{children}</div>
  </div>
);

const Button = ({ children, loading, variant = "primary", className = "", onClick, disabled }) => {
  const base = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95",
    outline: "border-2 border-slate-300 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 bg-white",
    ghost: "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
  };
  
  return (
    <button 
      className={`${base} ${styles[variant]} ${className}`} 
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? <Loader2 size={20} className="animate-spin" /> : children}
    </button>
  );
};

const Input = ({ label, error, value, onChange, type = "text" }) => (
  <div>
    {label && (
      <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-1 block">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition ${
        error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
      }`}
    />
    {error && <p className="text-xs text-red-600 mt-1 ml-1">{error}</p>}
  </div>
);

// --- DASHBOARDS ---
const TenantDashboard = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      addToast('Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    const description = prompt("Describe the maintenance issue:");
    if (!description?.trim()) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          tenant_id: session.user.id,
          description: description.trim(),
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setRequests([data, ...requests]);
      addToast('Maintenance request submitted', 'success');
    } catch (error) {
      addToast('Failed to submit request', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          title="My Lease" 
          icon={Home} 
          className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl"
        >
          <div className="mt-2">
            <p className="text-sm text-indigo-100 mb-1">Monthly Rent</p>
            <p className="text-5xl font-bold mb-4">$1,200</p>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/20">
              <span className="text-sm bg-white/20 px-3 py-1.5 rounded-full font-medium">
                Next Due: Oct 1
              </span>
              <button className="bg-white text-indigo-700 px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition active:scale-95">
                Pay Now
              </button>
            </div>
          </div>
        </Card>

        <Card 
          title="Maintenance Requests" 
          icon={Wrench}
          action={
            <button 
              onClick={handleRequest}
              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"
            >
              <PlusCircle size={20} />
            </button>
          }
        >
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-slate-400" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm">
                No active requests
              </div>
            ) : (
              requests.map(r => (
                <div 
                  key={r.id} 
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition"
                >
                  <span className="truncate flex-1 font-medium text-sm">
                    {r.description}
                  </span>
                  <span className={`ml-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ${
                    r.status === 'pending' 
                      ? 'bg-amber-100 text-amber-700' 
                      : r.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const LandlordDashboard = () => {
  const { session } = useAuth();
  const { addToast } = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      addToast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async () => {
    const address = prompt("Enter property address:");
    if (!address?.trim()) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          owner_id: session.user.id,
          address: address.trim(),
          price: 0,
          status: 'vacant'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProperties([data, ...properties]);
      addToast('Property added successfully', 'success');
    } catch (error) {
      addToast('Failed to add property', 'error');
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Portfolio</h1>
          <p className="text-slate-500 text-sm mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <Button onClick={addProperty} className="!py-2.5 !px-5">
          <PlusCircle size={18} />
          Add Property
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={40} />
        </div>
      ) : properties.length === 0 ? (
        <div className="col-span-full py-20 border-2 border-dashed border-slate-300 rounded-2xl text-center">
          <Home size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 mb-4">No properties yet</p>
          <Button onClick={addProperty} variant="outline">
            <PlusCircle size={18} />
            Add Your First Property
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <Card key={p.id} title="Property" icon={Home}>
              <h4 className="font-bold text-slate-900 mb-3 text-lg">
                {p.address}
              </h4>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                  p.status === 'vacant' 
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {p.status}
                </span>
                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                  Manage →
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CompanyDashboard = () => (
  <div className="text-center py-20 animate-fade-in">
    <Building2 size={64} className="mx-auto text-slate-300 mb-6" />
    <h2 className="text-2xl font-bold text-slate-700 mb-2">Company Dashboard</h2>
    <p className="text-slate-500">Coming soon...</p>
  </div>
);

// --- DASHBOARD LAYOUT ---
const DashboardLayout = () => {
  const { userRole, signOut, session } = useAuth();
  
  if (!userRole) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Building2 size={28} />
            <span>PropMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
              <User size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {session.user.email}
              </span>
            </div>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
              {userRole}
            </span>
            <button 
              onClick={signOut} 
              className="text-slate-400 hover:text-rose-600 transition p-2 rounded-lg hover:bg-slate-50"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {userRole === 'tenant' && <TenantDashboard />}
        {userRole === 'landlord' && <LandlordDashboard />}
        {userRole === 'company' && <CompanyDashboard />}
      </main>
    </div>
  );
};

// --- AUTH PAGE ---
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'tenant',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    
    if (!isLogin && !formData.name.trim()) newErrors.name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    const { email, password, role, name } = formData;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast('Welcome back!', 'success');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role } }
        });
        if (error) throw error;
        addToast('Account created! Please check your email to verify.', 'success');
        setIsLogin(true);
        setFormData({ email: '', password: '', role: 'tenant', name: '' });
      }
    } catch (err) {
      addToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6 animate-fade-in">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="text-center mb-8">
          <Building2 size={48} className="mx-auto text-indigo-600 mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500">Manage your property seamlessly</p>
        </div>

        <div className="space-y-4" onKeyPress={handleKeyPress}>
          {!isLogin && (
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              error={errors.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          )}
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            error={errors.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            error={errors.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />

          {!isLogin && (
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1 mb-2 block">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['tenant', 'landlord', 'company'].map(r => (
                  <button
                    key={r}
                    onClick={() => setFormData({...formData, role: r})}
                    className={`py-3 text-xs font-bold uppercase rounded-xl border-2 transition-all ${
                      formData.role === r
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button loading={loading} onClick={handleSubmit} className="w-full mt-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </div>

        <div className="mt-6 text-center pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already registered?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-2 text-indigo-600 font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const AppRouter = () => {
  const { isReady, session } = useAuth();

  if (!isReady) return <LoadingScreen />;

  // Redirect logic based on session
  if (!session) return <AuthPage />;
  return <DashboardLayout />;
};

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
