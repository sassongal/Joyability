import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Button } from './Button';
import { Command, AlertCircle, ArrowRight, Check, Copy, UserCircle, Info } from 'lucide-react';

interface LoginViewProps {
  onGuestLogin?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGuestLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname);
    }
  }, []);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    if (!auth) {
      setError("Firebase not configured.");
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/unauthorized-domain') {
         setError(`Domain "${currentDomain}" is not authorized.`);
      } else {
         setError(err.message || "Failed to sign in.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-platinum flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor - Joyability Palette */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-coral/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-teal/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-grey/10 rounded-2xl p-8 shadow-xl shadow-grey/5 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-coral to-coral-hover rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-coral/30">
            <Command className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Joyability</h1>
          <p className="text-grey/70">The ultimate bilingual productivity companion.</p>
        </div>

        <div className="space-y-4">
          
          {/* Guest Login - PRIMARY ACTION for quick access */}
          {onGuestLogin && (
            <Button 
              onClick={onGuestLogin} 
              variant="primary"
              size="lg" 
              className="w-full relative group"
            >
              <div className="flex items-center justify-center gap-3">
                <UserCircle className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Continue as Guest</span>
                <ArrowRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-5px] group-hover:translate-x-0" />
              </div>
            </Button>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-grey/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-grey/50 font-medium">Secure Login</span>
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            isLoading={isLoading} 
            variant="secondary"
            size="lg" 
            className="w-full"
          >
             <div className="flex items-center justify-center gap-3">
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF" fillOpacity="0.9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF" fillOpacity="0.7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FFFFFF" fillOpacity="0.6"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFFFFF" fillOpacity="0.8"/></svg>
               <span>Sign in with Google</span>
             </div>
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-sm animate-fade-in text-left">
              <AlertCircle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-grey font-semibold">Authentication Error</p>
                <p className="text-grey/70 mt-1">{error}</p>
                {error.includes("authorized") && (
                   <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 bg-grey/10 text-grey text-xs px-2 py-1 rounded truncate">
                        {currentDomain}
                      </code>
                      <button onClick={handleCopyDomain} className="text-teal hover:text-teal-hover">
                         {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-grey/10 text-center">
            <p className="text-xs text-grey/50">
                Joyability Design System v2.0 • Platinum
            </p>
        </div>
      </div>
    </div>
  );
};