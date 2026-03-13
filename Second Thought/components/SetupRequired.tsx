import { AlertCircle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import logoImage from '../assets/logo.png';

export function SetupRequired() {
  const [copied, setCopied] = useState(false);

  const envFileContent = `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={typeof logoImage === 'string' ? logoImage : (logoImage as any).default || (logoImage as any).uri || logoImage}
              alt="Logo" 
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-[#06402B] mb-2">Second Thought</h1>
          <p className="text-[#255736] text-lg">Setup Required</p>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">Supabase Configuration Needed</h2>
          </div>

          <p className="text-gray-700 mb-6">
            Your app needs to be connected to Supabase. Follow these quick steps to get started:
          </p>

          {/* Step 1 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#06402B] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <h3 className="font-semibold text-gray-900">Get Your Supabase Key</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Go to your Supabase project settings and copy the anon/public key:
            </p>
            <a
              href="https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#06402B] hover:underline font-medium"
            >
              Open Supabase Settings
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#06402B] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <h3 className="font-semibold text-gray-900">Create .env File</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              In the <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">mindful</code> folder, create a file named <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">.env</code> with this content:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm relative">
              <pre className="overflow-x-auto">{envFileContent}</pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Replace <code className="bg-gray-200 px-1.5 py-0.5 rounded">your_supabase_anon_key_here</code> with your actual key from Step 1
            </p>
          </div>

          {/* Step 3 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#06402B] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <h3 className="font-semibold text-gray-900">Set Up Database</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Run the SQL schema in your Supabase dashboard:
            </p>
            <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
              <li>Open the SQL Editor in Supabase</li>
              <li>Copy the contents of <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">database/schema.sql</code></li>
              <li>Paste and run in the SQL Editor</li>
            </ol>
            <a
              href="https://mohgivduzthccoybnbnr.supabase.co/project/_/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#06402B] hover:underline font-medium mt-3"
            >
              Open SQL Editor
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Step 4 */}
          <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#06402B] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <h3 className="font-semibold text-gray-900">Restart Dev Server</h3>
            </div>
            <p className="text-sm text-gray-600">
              After creating the <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">.env</code> file, stop your development server (Ctrl+C) and restart it:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mt-3">
              npm start
            </div>
          </div>

          {/* Help Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              📚 Need more help? Check out these guides:
            </p>
            <div className="flex gap-3 text-sm">
              <a href="#" className="text-[#06402B] hover:underline font-medium">QUICK_START.md</a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-[#06402B] hover:underline font-medium">SUPABASE_SETUP.md</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


