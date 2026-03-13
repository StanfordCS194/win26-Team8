import { useState } from 'react';
import { testConnection } from '../lib/database';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * DIAGNOSTIC PANEL
 * 
 * A simple UI component to test Supabase connectivity
 * Helps diagnose network/connection issues
 */
export function DiagnosticPanel() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    console.log('🔍 Running diagnostic test...');
    
    const { success, error } = await testConnection();
    
    if (success) {
      setResult({
        success: true,
        message: 'Supabase connection is working! ✅',
      });
    } else {
      setResult({
        success: false,
        message: error?.message || 'Connection test failed',
      });
    }
    
    setTesting(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl shadow-lg p-4 max-w-md">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Connection Diagnostic</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Test if your browser can reach Supabase
        </p>
      </div>

      <button
        onClick={runTest}
        disabled={testing}
        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Testing...
          </>
        ) : (
          'Test Connection'
        )}
      </button>

      {result && (
        <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
          result.success 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-destructive/10 border border-destructive/20'
        }`}>
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              result.success ? 'text-green-500' : 'text-destructive'
            }`}>
              {result.success ? 'Connected' : 'Connection Failed'}
            </p>
            <p className="text-xs text-foreground/70 mt-1">
              {result.message}
            </p>
            {!result.success && (
              <p className="text-xs text-muted-foreground mt-2">
                Check: VPN, firewall, browser extensions
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Check browser console (F12) for detailed logs
        </p>
      </div>
    </div>
  );
}
