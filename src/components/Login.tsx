import React from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { MessageSquare, ShieldCheck, Globe, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 relative border border-slate-100"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 blur-3xl -z-10" />

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-indigo-200 shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-transform">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Nexus</h1>
          <p className="text-slate-500 font-medium text-center">Secure real-time communication for distributed teams.</p>
        </div>

        <div className="space-y-4 mb-10">
          <Feature icon={<ShieldCheck className="w-5 h-5 text-indigo-500" />} text="Private, secure channels" />
          <Feature icon={<Globe className="w-5 h-5 text-indigo-500" />} text="Global real-time sync" />
          <Feature icon={<Zap className="w-5 h-5 text-indigo-500" />} text="Google Powered Auth" />
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
          Sign in with Google
        </button>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          By signing in, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
      {icon}
      <span className="text-sm font-semibold text-slate-700">{text}</span>
    </div>
  );
}
