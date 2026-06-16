import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Leaf, Globe, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<{
    code: string;
    message: string;
    showHelp: boolean;
  } | null>(null);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Sign in popup error caught in page:", err);
      const code = err?.code || "";
      let message = "An authentication error occurred. Please verify your connection and try again.";
      let showHelp = false;

      if (code === "auth/popup-blocked" || err?.message?.includes("popup-blocked") || err?.message?.includes("popup blocked")) {
        message = "Your browser blocked the Google Sign-In popup window.";
        showHelp = true;
      } else if (code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user") || err?.message?.includes("closed by user")) {
        message = "The Google Sign-In tab was closed before authentication could complete.";
        showHelp = true;
      } else {
        message = err?.message || message;
        showHelp = true;
      }

      setAuthError({ code, message, showHelp });
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div id="login-frame-container" className="min-h-screen bg-brand-sand text-brand-stone font-sans flex flex-col justify-between p-6 relative overflow-hidden select-none">
      
      {/* Decorative ambient background blur vectors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-moss/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-earth/5 blur-[120px] pointer-events-none" />

      {/* Dynamic Top brand label */}
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-sage font-bold">
          <Globe size={11} className="text-brand-earth" />
          <span>Zero-Carbon Framework</span>
        </div>
        <div className="text-[10px] font-mono text-brand-sage border border-[#e5e5dc]/80 rounded-full px-3 py-1">
          v1.4 Offline-Resilient
        </div>
      </header>

      {/* Centered Login Slate */}
      <main className="max-w-md w-full mx-auto my-auto py-12 flex flex-col items-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <div className="w-16 h-16 rounded-[24px] bg-brand-earth flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#5a5a40]/30 relative group">
            <Leaf size={32} className="text-brand-sand transform group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-[24px] border border-white/20" />
          </div>
          
          <h1 className="text-6xl font-serif italic text-brand-earth select-none tracking-tight">
            Terra.
          </h1>
          <p className="text-[10px] font-mono whitespace-nowrap text-brand-sage border-y border-[#e5e5dc] py-1.5 px-4 rounded-full uppercase tracking-widest inline-block mt-3 bg-brand-sand/50 shadow-sm">
            Interactive Climate Footprint Advisor
          </p>
        </motion.div>

        {/* Auth control card container */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white border border-[#e5e5dc] rounded-[36px] p-8 w-full shadow-md relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-earth rounded-t-[36px]" />
          
          <h2 className="text-lg font-serif italic text-brand-stone text-center mb-2">
            Secure Member Portal
          </h2>
          <p className="text-xs text-brand-sage text-center mb-8 leading-relaxed font-sans px-4">
            Sign up or log in using Google only. We store your preferences, daily scores, and environmental challenges safely inside our Zero-Trust Firestore database.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={loading || signingIn}
              className="w-full h-13 bg-brand-sand hover:bg-[#e5e5dc] font-bold text-xs uppercase tracking-widest text-brand-stone rounded-2xl border border-[#e5e5dc] flex items-center justify-center gap-3.5 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{signingIn ? "Accessing server..." : "Continue with Google"}</span>
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl text-xs text-red-800 space-y-2 leading-relaxed">
              <p className="font-semibold">{authError.message}</p>
              {authError.showHelp && (
                <div className="pt-2 border-t border-red-200/45 space-y-2 text-[11px] text-red-700">
                  <p className="font-semibold text-red-800">To complete your sign-in, please try either:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>Option 1 (Easiest & Fastest):</strong> Click the <strong>"Open in a new tab"</strong> icon in the top-right corner of this preview window. In a dedicated tab, the browser will open the login page perfectly.
                    </li>
                    <li>
                      <strong>Option 2:</strong> Look at your browser's address bar for the **Pop-up blocked** icon, click it, and select <strong>"Always allow pop-ups"</strong>, then click button above to retry.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Clean disclaimer list */}
          <div className="mt-8 border-t border-[#e5e5dc]/60 pt-6 space-y-2">
            <div className="flex gap-2 text-[10px] text-brand-clay leading-normal">
              <Sparkles size={11} className="text-brand-earth shrink-0 mt-0.5" />
              <span>We'll retrieve your displayName and verified photoURL automatically to build your carbon card profile.</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Elegant Footer matching Terra branding */}
      <footer className="w-full max-w-7xl mx-auto text-center text-[10px] text-brand-sage font-mono border-t border-[#e5e5dc] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} Terra Climate. All global data protected under client constraints.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Security Blueprints</a>
          <a href="#" className="hover:underline">Zero-Denial Guard</a>
        </div>
      </footer>
    </div>
  );
}
