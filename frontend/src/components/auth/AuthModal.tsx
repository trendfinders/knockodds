'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  strings: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    displayName: string;
    signInWithGoogle: string;
    or: string;
    noAccount: string;
    hasAccount: string;
    close: string;
  };
}

export function AuthModal({ isOpen, onClose, strings }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } else {
      const result = await signUp(email, password, displayName);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Check your email to confirm your account.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-dark text-xl"
          aria-label={strings.close}
        >
          &times;
        </button>

        <h2 className="text-2xl font-heading font-bold mb-6">
          {mode === 'signin' ? strings.signIn : strings.signUp}
        </h2>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 bg-surface-alt text-dark font-bold py-2.5 px-4 rounded border border-gray-200 transition-colors hover:bg-surface-muted mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
          {strings.signInWithGoogle}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">{strings.or}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder={strings.displayName}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder={strings.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder={strings.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'signin' ? strings.signIn : strings.signUp}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'signin' ? strings.noAccount : strings.hasAccount}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
            className="text-primary hover:text-primary-dark"
          >
            {mode === 'signin' ? strings.signUp : strings.signIn}
          </button>
        </p>
      </div>
    </div>
  );
}
