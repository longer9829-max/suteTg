import React, { useState } from 'react';
import { loginWithGoogle, sendMagicLink } from '../lib/firebase';
import { MessageSquare, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (error) {
      alert("Failed to send magic link. Make sure email auth is enabled in Firebase Console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.06)] p-10 relative border border-slate-100"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-50 rounded-full opacity-40 blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-50 rounded-full opacity-40 blur-3xl -z-10" />

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-indigo-100 shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-all duration-500">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Nexus</h1>
          <p className="text-slate-500 font-medium text-center">Seamless communication for modern teams.</p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Continue with Email"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                onClick={loginWithGoogle}
                className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                Sign in with Google
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="sent-msg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Check your email</h3>
              <p className="text-slate-500 text-sm mb-8">
                We sent a login link to <span className="font-bold text-indigo-600">{email}</span>. 
                Click the link in the message to sign in securely.
              </p>
              <button 
                onClick={() => setSent(false)}
                className="text-indigo-600 font-bold text-sm hover:underline"
              >
                Try a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
          Secure authentication powered by Firebase. <br/>
          By signing in, you agree to our privacy policy.
        </p>
      </motion.div>
    </div>
  );
}
