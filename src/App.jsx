import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Building2, Key, User, LogOut, Home, Wrench, DollarSign, PlusCircle, AlertCircle } from 'lucide-react';

// --- 1. CONFIGURATION ---
const supabaseUrl ='https://ccaagvcrctbdbtmelmak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWFndmNyY3RiZGJ0bWVsbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDcxMDEsImV4cCI6MjA4MTEyMzEwMX0.kkoAUyEf5u8BTOdP_JIOqaVWXUPZNS4oxPqo0-cSIAc';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. AUTH CONTEXT (Global State) ---
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
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

    // Listen for changes
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
      console.error('Role fetch error:', error);
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

export const useAuth = () => useContext(AuthContext);

// --- 3. UI COMPONENTS ---

// Shared Layout with Navbar
const Layout = () => {
  const { signOut, userRole, session } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Building2 /> <span>PropMaster</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase text-xs font-bold tracking-wider">
            {userRole || 'Guest'}
          </span>
          <div className="text-sm font-medium text-gray-700 hidden md:block">
            {session?.user?.email}
          </div>
          <button onClick={signOut} className="text-gray-500 hover:text-red-600 transition">
            <LogOut size={20} />
          </button>
        </div>
      </nav>
      <div className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

// Generic Card Component
const Card = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          {Icon && <Icon size={24} />}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {action}
    </div>
    <div className="text-gray-600">{children}</div>
  </div>
);

// --- 4. DASHBOARD VIEWS ---

const TenantView = () => {
  const [requests, setRequests] = useState([]);
  const { session } = useAuth();

  // Real data fetching example
  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase.from('maintenance_requests').select('*').eq('tenant_id', session.user.id);
      if (data) setRequests(data);
    };
    fetchRequests();
  }, [session]);

  const handleNewRequest = async () => {
    const desc = prompt("Describe the issue:");
    if (!desc) return;
    const { error } = await supabase.from('maintenance_requests').insert({
      tenant_id: session.user.id,
      description: desc,
      status: 'pending'
    });
    if (!error) alert('Request submitted!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card title="Current Lease" icon={Home}>
        <p className="text-2xl font-bold text-gray-900">$1,200 <span className="text-sm font-normal text-gray-500">/mo</span></p>
        <p className="text-sm text-gray-500 mt-1">Due: Oct 1st, 2025</p>
        <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">Pay Rent</button>
      </Card>

      <Card title="Maintenance" icon={Wrench} 
        action={<button onClick={handleNewRequest} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><PlusCircle size={20}/></button>}>
        {requests.length === 0 ? <p>No active requests.</p> : (
          <ul className="space-y-2">
            {requests.map(req => (
              <li key={req.id} className="flex justify-between text-sm border-b pb-2">
                <span>{req.description}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {req.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

const LandlordView = () => {
  const [properties, setProperties] = useState([]);
  const { session } = useAuth();

  useEffect(() => {
    const fetchProps = async () => {
      const { data } = await supabase.from('properties').select('*').eq('owner_id', session.user.id);
      if (data) setProperties(data);
    };
    fetchProps();
  }, [session]);

  const addProperty = async () => {
    const address = prompt("Property Address:");
    if (!address) return;
    const { error } = await supabase.from('properties').insert({ owner_id: session.user.id, address, status: 'vacant' });
    if (!error) window.location.reload(); 
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Portfolio</h2>
        <button onClick={addProperty} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          <PlusCircle size={18}/> Add Property
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(prop => (
          <Card key={prop.id} title="Property" icon={Home}>
            <h4 className="font-semibold">{prop.address}</h4>
            <p className="text-sm text-gray-500 mb-3 capitalize">Status: {prop.status}</p>
            <div className="flex gap-2 text-sm">
              <button className="text-indigo-600 font-medium">View Lease</button>
              <button className="text-gray-500">History</button>
            </div>
          </Card>
        ))}
        {properties.length === 0 && <p className="text-gray-500">No properties found.</p>}
      </div>
    </div>
  );
};

const CompanyView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {['Total Revenue', 'Active Units', 'Vacancies', 'Agents'].map((stat) => (
        <div key={stat} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">{stat}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">--</p>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4">Enterprise Management</h3>
      <p className="text-gray-600">This view would contain high-level analytics and user management tables.</p>
    </div>
  </div>
);

// --- 5. AUTH PAGES ---

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          <button disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          New here? <Link to="/register" className="text-indigo-600 font-bold">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tenant', fullName: '' });
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign Up
    const { data: { user }, error: authError } = await supabase.auth.signUp({ 
      email: formData.email, 
      password: formData.password,
      options: {
        data: { full_name: formData.fullName, role: formData.role } // Metadata for trigger
      }
    });

    if (authError) alert(authError.message);
    else alert("Success! Check your email to confirm.");
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Full Name" onChange={e=>setFormData({...formData, fullName: e.target.value})} 
            className="w-full p-3 border rounded-lg" required />
          <input type="email" placeholder="Email" onChange={e=>setFormData({...formData, email: e.target.value})} 
            className="w-full p-3 border rounded-lg" required />
          <input type="password" placeholder="Password" onChange={e=>setFormData({...formData, password: e.target.value})} 
            className="w-full p-3 border rounded-lg" required />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a:</label>
            <div className="grid grid-cols-3 gap-2">
              {['tenant', 'landlord', 'company'].map((r) => (
                <button key={r} type="button" 
                  onClick={() => setFormData({...formData, role: r})}
                  className={`p-2 text-sm rounded border ${formData.role === r ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Have an account? <Link to="/login" className="text-indigo-600 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
};

// --- 6. ROUTER ---

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<RoleBasedRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Redirects user to their specific view based on role
const RoleBasedRedirect = () => {
  const { userRole, session } = useAuth();

  if (!session) return <Navigate to="/login" />;
  if (!userRole) return <div className="p-8 text-center">Loading profile...</div>;

  switch (userRole) {
    case 'tenant': return <TenantView />;
    case 'landlord': return <LandlordView />;
    case 'company': return <CompanyView />;
    default: return <div className="p-8 text-red-600">Unknown Role</div>;
  }
};

