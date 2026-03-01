import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

type Tab = 'login' | 'register';

// ─────────────────────────────────────────────────────────────
// Login form
// ─────────────────────────────────────────────────────────────
const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_BASE || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Both fields are required.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login({ ...data.user, rememberMe });
        navigate('/');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('Could not reach server. Check VITE_API_BASE in .env');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={e => setRememberMe(e.target.checked)}
          className="w-4 h-4 accent-red-500 cursor-pointer"
        />
        <span className="text-xs text-slate-300">Remember me</span>
      </label>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// Register form
// ─────────────────────────────────────────────────────────────
const RegisterForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE || '';

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', aadhaar: '',
    password: '', confirmPassword: '', ageConfirmed: false, rememberMe: false,
  });
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.firstName.trim()) err.firstName = 'Required';
    if (!formData.lastName.trim())  err.lastName  = 'Required';

    const emailOk = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook)\.(com|in)$/.test(formData.email);
    if (!emailOk) err.email = 'Use a gmail, yahoo, or outlook address';

    const aadhaarOk = /^[2-9][0-9]{11}$/.test(formData.aadhaar);
    if (!aadhaarOk) err.aadhaar = 'Must be 12 digits starting with 2–9';

    if (formData.password.length < 8)          err.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(formData.password)) err.password = 'Must include an uppercase letter';
    else if (!/[a-z]/.test(formData.password)) err.password = 'Must include a lowercase letter';

    if (formData.password !== formData.confirmPassword) err.confirmPassword = 'Passwords do not match';
    if (!formData.ageConfirmed) err.ageConfirmed = 'You must confirm you are 18+';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName:  formData.lastName,
          email:     formData.email,
          aadhaar:   formData.aadhaar,
          password:  formData.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // After register, log the user in via the login endpoint
        const loginRes = await fetch(`${apiBase}/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          login({ ...loginData.user, rememberMe: formData.rememberMe });
        }
        navigate('/');
      } else {
        setServerError(data.message || 'Registration failed.');
      }
    } catch {
      setServerError('Could not reach server. Check VITE_API_BASE in .env');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    id: keyof typeof formData,
    label: string,
    type = 'text',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        name={id}
        value={formData[id] as string}
        onChange={handle}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
      />
      {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field('firstName', 'First Name', 'text', 'First name')}
        {field('lastName',  'Last Name',  'text', 'Last name')}
      </div>
      {field('email',    'Email',    'email',    'gmail / yahoo / outlook')}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Aadhaar Number</label>
        <input
          type="text"
          name="aadhaar"
          maxLength={12}
          placeholder="12-digit Aadhaar"
          value={formData.aadhaar}
          onChange={e => setFormData(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '') }))}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
        />
        {errors.aadhaar && <p className="text-red-400 text-xs mt-1">{errors.aadhaar}</p>}
      </div>
      {field('password',        'Password',         'password', 'Min 8 chars, upper + lower')}
      {field('confirmPassword', 'Confirm Password', 'password', 'Re-enter password')}

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="ageConfirmed" checked={formData.ageConfirmed}
            onChange={handle} className="w-4 h-4 accent-red-500 cursor-pointer" />
          <span className="text-xs text-slate-300">I confirm I am above 18 years of age</span>
        </label>
        {errors.ageConfirmed && <p className="text-red-400 text-xs ml-6">{errors.ageConfirmed}</p>}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="rememberMe" checked={formData.rememberMe}
            onChange={handle} className="w-4 h-4 accent-red-500 cursor-pointer" />
          <span className="text-xs text-slate-300">Remember me</span>
        </label>
      </div>

      {serverError && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
      >
        {loading ? 'Creating Account…' : 'Create Account'}
      </Button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────
// Main page — tab switcher
// ─────────────────────────────────────────────────────────────
const SignIn = () => {
  const [tab, setTab] = useState<Tab>('login');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const apiBase = import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    if (!apiBase) { setServerOnline(false); return; }
    let cancelled = false;
    fetch(`${apiBase}/ping.php`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setServerOnline(!!d.success); })
      .catch(() => { if (!cancelled) setServerOnline(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 shadow-2xl border border-slate-800">

          {/* Brand */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">
              Companion<span className="text-red-500">.</span>
            </h1>
            <p className="text-slate-400 text-sm">Experience events together</p>
          </div>

          {/* Server warning */}
          {serverOnline === false && (
            <div className="mb-4 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg p-3 border border-yellow-400/20 text-center">
              ⚠️ Server unreachable — set <code className="bg-slate-700 px-1 rounded">VITE_API_BASE</code> in <code className="bg-slate-700 px-1 rounded">.env</code>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'login'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'register'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}

          {/* Info box — only on register tab */}
          {tab === 'register' && (
            <div className="mt-5 p-3.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700">
              <p className="font-semibold text-slate-200 mb-2">What you can do on Companion:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>🎟 Book tickets for movies, concerts & live events</li>
                <li>👥 Find companions to attend with</li>
                <li>⭐ Leave reviews for events and the site</li>
                <li>🔐 Safe, Aadhaar age-verified community</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
