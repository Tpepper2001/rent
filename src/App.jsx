import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, LogOut, Home, Wrench, PlusCircle, 
  User, CheckCircle, AlertCircle, LayoutDashboard 
} from 'lucide-react';
import './index.css';

// --- 1. SUPABASE CONFIGURATION ---
const supabaseUrl = 'https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. AUTH CONTEXT ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
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
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
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

// --- 3. UI COMPONENTS ---

const Card = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          {Icon && <Icon size={24} />}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="text-gray-600">{children}</div>
  </div>
);

const Navbar = () => {
  const { signOut, userRole, session } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
        <Building2 /> <span>PropMaster</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
          {userRole || 'Guest'}
        </span>
        <span className="hidden md:block text-sm text-gray-500">{session?.user?.email}</span>
        <button onClick={signOut} className="text-gray-400 hover:text-red-600 transition-colors" title="Sign Out">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

const ProtectedLayout = () => {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
};

// --- 4. DASHBOARD VIEWS ---

// TENANT DASHBOARD
const TenantView = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setRequests(data);
    };
    fetchRequests();
  }, [session]);

  const handleRequest = async () => {
    const desc = prompt("Describe the maintenance issue:");
    if (!desc) return;
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({ tenant_id: session.user.id, description: desc, status: 'pending' })
      .select();

    if (!error && data) setRequests([data[0], ...requests]);
    else alert("Error submitting request");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome Home</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Lease Overview" icon={Home}>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="text-3xl font-bold text-gray-900">$1,200.00</p>
            <p className="text-sm text-orange-600 font-medium bg-orange-50 inline-block px-2 py-1 rounded">
              Due in 5 days
            </p>
            <button className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
              Pay Now
            </button>
          </div>
        </Card>

        <Card title="Maintenance" icon={Wrench} 
          action={<button onClick={handleRequest} className="text-indigo-600 hover:text-indigo-800"><PlusCircle /></button>}>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {requests.length === 0 ? <p className="text-sm text-gray-400">No active requests.</p> : (
              requests.map(req => (
                <div key={req.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="truncate w-2/3">{req.description}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      req.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {req.status.replace('_', ' ')}
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

// LANDLORD DASHBOARD
const LandlordView = () => {
  const { session } = useAuth();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProps = async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id);
      if (data) setProperties(data);
    };
    fetchProps();
  }, [session]);

  const addProperty = async () => {
    const address = prompt("Enter Property Address:");
    if (!address) return;
    const price = prompt("Enter Monthly Rent Amount:");
    
    const { data, error } = await supabase
      .from('properties')
      .insert({ owner_id: session.user.id, address, price: parseFloat(price), status: 'vacant' })
      .select();

    if (!error && data) setProperties([...properties, data[0]]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Property Portfolio</h1>
        <button onClick={addProperty} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <PlusCircle size={18} /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(prop => (
          <Card key={prop.id} title="Property" icon={Home}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900">{prop.address}</h4>
                <p className="text-indigo-600 font-medium">${prop.price}/mo</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                ${prop.status === 'vacant' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {prop.status}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 text-sm">
              <button className="text-gray-500 hover:text-indigo-600">Details</button>
              <button className="text-gray-500 hover:text-indigo-600">History</button>
            </div>
          </Card>
        ))}
        {properties.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            No properties added yet.
          </div>
        )}
      </div>
    </div>
  );
};

// COMPANY DASHBOARD
const CompanyView = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold text-gray-900">Enterprise Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
        <p className="text-indigo-200">Total Revenue (YTD)</p>
        <p className="text-4xl font-bold mt-2">$2.4M</p>
      </div>
      <Card title="Active Agents" icon={User}>
        <p className="text-3xl font-bold text-gray-900">24</p>
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={14}/> 100% Online</p>
      </Card>
      <Card title="System Alerts" icon={AlertCircle}>
        <p className="text-3xl font-bold text-gray-900">3</p>
        <p className="text-sm text-red-600 mt-1">Requires attention</p>
      </Card>
    </div>
    
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-medium text-gray-700">Recent Transactions</div>
      <div className="p-6 text-gray-500 text-center italic">
        Transaction table placeholder...
      </div>
    </div>
  </div>
);

// --- 5. AUTH PAGES ---

const AuthPage = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tenant', fullName: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (type === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: formData.email, 
        password: formData.password 
      });
      if (error) alert(error.message);
    } else {
      // Register
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName, role: formData.role }
        }
      });
      if (error) alert(error.message);
      else alert("Check your email for confirmation link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6 text-indigo-600">
          <Building2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          {type === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <input type="text" placeholder="Full Name" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={e => setFormData({...formData, fullName: e.target.value})} required />
          )}
          
          <input type="email" placeholder="Email Address" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={e => setFormData({...formData, email: e.target.value})} required />
            
          <input type="password" placeholder="Password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={e => setFormData({...formData, password: e.target.value})} required />

          {type === 'register' && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['tenant', 'landlord', 'company'].map(r => (
                <button type="button" key={r}
                  onClick={() => setFormData({...formData, role: r})}
                  className={`py-2 px-1 text-xs font-bold uppercase rounded border transition-all ${
                    formData.role === r 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 mt-4">
            {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Register')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          {type === 'login' ? "Don't have an account?" : "Already have an account?"}
          <Link to={type === 'login' ? '/register' : '/login'} className="ml-2 text-indigo-600 font-bold hover:underline">
            {type === 'login' ? 'Sign Up' : 'Log In'}
          </Link>
        </p>
      </div>
    </div>
  );
};

// --- 6. ROUTING & LOGIC ---

const RoleBasedRedirect = () => {
  const { userRole } = useAuth();
  
  // While fetching role
  if (!userRole) return <div className="p-10 text-center text-gray-500">Loading your profile...</div>;

  switch (userRole) {
    case 'tenant': return <TenantView />;
    case 'landlord': return <LandlordView />;
    case 'company': return <CompanyView />;
    default: return <div className="p-10 text-center text-red-500">Error: Unknown Role</div>;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// --- 7. MOUNTING TO DOM (Replaces main.jsx) ---
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
