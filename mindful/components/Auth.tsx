/**
 * AUTH.TSX - USER AUTHENTICATION COMPONENT
 * 
 * This component handles user authentication (sign up and sign in) for the app.
 * It provides a full-screen authentication page with a form that switches between
 * sign-up and sign-in modes.
 * 
 * FEATURES:
 * - Sign Up: Create new account with email, password, and full name
 * - Sign In: Log in with existing credentials
 * - Toggle: Switch between sign-up and sign-in modes
 * - Error handling: Display error messages to the user
 * - Loading states: Show "Loading..." while authenticating
 * 
 * AUTHENTICATION FLOW:
 * 1. User enters credentials in the form
 * 2. Form calls signUp() or signIn() from AuthContext
 * 3. AuthContext communicates with Supabase Auth API
 * 4. If successful: User is logged in, redirected to app
 * 5. If failed: Error message is displayed
 * 
 * DATABASE OPERATIONS:
 * - Sign Up: Creates user in auth.users table + creates profile in public.profiles
 * - Sign In: Validates credentials and creates session
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Auth() {
  // ===== STATE MANAGEMENT =====
  // Toggle between sign-up and sign-in modes
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form field values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only used for sign-up
  
  // UI state
  const [error, setError] = useState(''); // Error message to display
  const [loading, setLoading] = useState(false); // Show loading spinner
  
  // Get authentication functions from context
  const { signIn, signUp } = useAuth();

  /**
   * HANDLE FORM SUBMISSION
   * 
   * This function is called when the user submits the form.
   * It handles both sign-up and sign-in based on the current mode.
   * 
   * SIGN UP PROCESS:
   * 1. Validates email, password, and full name
   * 2. Calls signUp(email, password, fullName) from AuthContext
   * 3. AuthContext creates user in Supabase auth.users table
   * 4. Trigger creates profile in public.profiles table
   * 5. If successful: Shows success message, switches to sign-in mode
   * 6. If failed: Shows error message
   * 
   * SIGN IN PROCESS:
   * 1. Validates email and password
   * 2. Calls signIn(email, password) from AuthContext
   * 3. AuthContext validates credentials with Supabase
   * 4. If successful: Creates session, user is logged in
   * 5. If failed: Shows error message
   * 
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setError(''); // Clear any previous errors
    setLoading(true); // Show loading state

    try {
      if (isSignUp) {
        // SIGN UP MODE
        // Create new user account with email, password, and full name
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message || 'Failed to sign up');
        } else {
          // Success! Account created
          alert('Account created! You can now sign in.');
          setIsSignUp(false); // Switch to sign-in mode
        }
      } else {
        // SIGN IN MODE
        // Log in with existing credentials
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Failed to sign in');
        }
        // If successful, AuthContext will handle the redirect
      }
    } catch (err: any) {
      // Handle unexpected errors
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  // ===== RENDER UI =====
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Second Thought
          </h1>
          <p className="text-2xl text-muted-foreground">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Authentication Form Card */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-12">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
            
            {/* Full Name Field (Sign-Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-base font-medium text-foreground/80 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp} // Only required when signing up
                  placeholder="John Doe"
                  className="w-full px-5 py-4 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-lg"
                />
              </div>
            )}

            {/* Email Field */}
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
                className="w-full px-5 py-4 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-lg"
              />
            </div>

            {/* Password Field */}
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
                minLength={6} // Minimum 6 characters for security
                className="w-full px-5 py-4 border border-border bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-lg"
              />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-base">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading} // Disable while processing
              className="w-full bg-primary text-primary-foreground px-8 py-5 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold mt-4"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            {/* Toggle Between Sign-Up and Sign-In */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp); // Switch modes
                  setError(''); // Clear any errors when switching
                }}
                className="text-primary hover:underline text-base"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
