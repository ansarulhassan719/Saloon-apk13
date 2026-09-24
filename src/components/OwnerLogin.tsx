import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Shield, Lock, User, AlertCircle, ArrowRight, X } from 'lucide-react';

interface OwnerLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onSuccess, onCancel }) => {
  const { loginOwner, t } = useApp();
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Please enter username and password');
      return;
    }

    setLoading(true);
    const res = await loginOwner(username.trim(), password);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
          <Shield className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-white">{t.loginTitle}</h2>
        <p className="text-xs text-slate-400 mt-1">
          Sahjahan Saloon management panel
        </p>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs p-3 rounded-xl mt-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t.username}
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none pl-9 font-medium"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {t.password}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter owner password"
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none pl-9"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Default Credentials Helper */}
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-amber-400">Default Credentials:</div>
            <div>Username: <span className="font-mono text-white">owner</span></div>
            <div>Password: <span className="font-mono text-white">sahjahan123</span></div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg active:scale-95 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>{t.loginBtn}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
