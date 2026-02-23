import { useState } from 'react';

interface AuthProps {
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp?: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  compact?: boolean;
  embedded?: boolean;
}

export function Auth({ onSignIn, onSignUp, compact = false, embedded = false }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showSignUp = !!onSignUp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp && onSignUp) {
        const { error } = await onSignUp(email, password, fullName);
        if (error) {
          setError(error.message || 'Failed to sign up');
        } else {
          alert('Account created! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await onSignIn(email, password);
        if (error) {
          setError(error.message || 'Failed to sign in');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (embedded) {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && showSignUp && (
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          {showSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-primary hover:underline text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'min-h-screen bg-background flex items-center justify-center p-8'}>
      <div className={compact ? 'w-full' : 'w-full max-w-4xl'}>
        <div className={`text-center ${compact ? 'mb-6' : 'mb-12'}`}>
          <h1 className={`font-bold text-foreground ${compact ? 'text-2xl mb-1' : 'text-5xl mb-4'}`}>
            Second Thought
          </h1>
          <p className={`text-muted-foreground ${compact ? 'text-sm' : 'text-2xl'}`}>
            {isSignUp ? 'Create your account' : compact ? 'Sign in to save items' : 'Welcome back'}
          </p>
        </div>

        <div className={compact ? 'bg-card rounded-2xl shadow-sm border border-border/50 p-6' : 'bg-card rounded-3xl shadow-xl border border-border p-12'}>
          <form onSubmit={handleSubmit} className={`space-y-${compact ? '4' : '6'} ${compact ? '' : 'max-w-xl mx-auto'}`}>
            {isSignUp && showSignUp && (
              <div>
                <label className="block text-base font-medium text-foreground/80 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  placeholder="John Doe"
                  className={`w-full border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${compact ? 'px-4 py-3' : 'px-5 py-4 text-lg'}`}
                />
              </div>
            )}

            <div>
              <label className="block text-base font-medium text-foreground/80 mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className={`w-full border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${compact ? 'px-4 py-3' : 'px-5 py-4 text-lg'}`}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-foreground/80 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className={`w-full border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${compact ? 'px-4 py-3' : 'px-5 py-4 text-lg'}`}
              />
            </div>

            {error && (
              <div className={`bg-destructive/10 border border-destructive/20 text-destructive rounded-xl ${compact ? 'p-3 text-sm' : 'p-4 text-base'}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold ${compact ? 'px-6 py-3 shadow-sm hover:shadow-md' : 'px-8 py-5 shadow-lg hover:shadow-xl text-lg mt-4'}`}
            >
              {loading ? (compact ? 'Signing in...' : 'Loading...') : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            {showSignUp && (
              <div className={`text-center ${compact ? 'mt-4' : 'mt-8'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className={`text-primary hover:underline ${compact ? 'text-sm' : 'text-base'}`}
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
