import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected authentication error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-3 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            LeetCode Practice Tracker
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {isRegister
              ? 'Create an account to start tracking your progress'
              : 'Sign in to access your personal problem tracking'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              loading={isLoading}
              icon={isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-text-muted">
              {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="font-semibold text-brand hover:underline cursor-pointer ml-1"
              >
                {isRegister ? 'Sign In' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
