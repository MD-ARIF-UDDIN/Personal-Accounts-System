import React, { useState } from 'react';
import { Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface AuthPageProps {
  onLoginSuccess: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError('Please enter both phone number and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await api.signIn(phone, password);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid phone or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm w-full mx-auto space-y-5">
        {/* Logo and title */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-sky-500/30">
            PA
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Personal Accounting System
          </h1>
          <p className="text-xs text-sky-200/80 font-medium">
            Sign in with your Phone & Password
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  autoFocus
                  placeholder="e.g. 01700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
