import React, { useState } from 'react';
import { Lock, Delete, User } from 'lucide-react';
import { classNames } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth, setToken } from '../../lib/api';

export function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNumberClick = async (num: number) => {
    if (error) setError(null);
    if (isLoading || pin.length >= 4) return;

    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      setIsLoading(true);
      try {
        const { token } = await auth.login(username, newPin);
        setToken(token);
        onLogin(token);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Incorrect credentials.');
        setTimeout(() => {
          setPin('');
          setError(null);
          setIsLoading(false);
        }, 1500);
      }
    }
  };

  const handleBackspace = () => {
    if (error) setError(null);
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50 w-full max-w-sm"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20">
          <Lock size={32} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Enter your username and PIN to continue.</p>

        {/* Username Field */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <User size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder-slate-400"
          />
        </div>

        {/* PIN Dots */}
        <div className="mb-4 flex justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={classNames(
                'w-4 h-4 rounded-full transition-all duration-150',
                error ? 'bg-red-500 scale-110' : pin.length > i ? 'bg-slate-900' : 'bg-slate-200'
              )}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-xs font-bold text-center mb-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isLoading}
              className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-900 transition-colors disabled:opacity-40"
            >
              {num}
            </button>
          ))}
          <div className="col-start-2">
            <button
              onClick={() => handleNumberClick(0)}
              disabled={isLoading}
              className="h-16 w-full rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-900 transition-colors disabled:opacity-40"
            >
              0
            </button>
          </div>
          <button
            onClick={handleBackspace}
            disabled={pin.length === 0 || isLoading}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Delete size={28} />
          </button>
        </div>

        {isLoading && (
          <p className="text-center text-xs text-slate-400 mt-4 animate-pulse">Signing in...</p>
        )}
      </motion.div>
    </div>
  );
}
