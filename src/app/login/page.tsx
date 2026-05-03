"use client";

import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { login, signup } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    if (isLogin) {
      const res = await login(formData);
      if (res?.error) setError(res.error);
    } else {
      const res = await signup(formData);
      if (res?.error) setError(res.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#030303] selection:bg-rose-500/30">
      
      {/* Navbar with Back Button */}
      <nav className="fixed top-0 w-full z-50 p-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md w-max">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </button>`n      </nav>

      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 w-full max-w-md bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-br from-rose-500/20 to-indigo-600/20 p-4 rounded-2xl mb-4 border border-white/5">
              <Sparkles className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? "Tekrar Hoş Geldin" : "YouBrain'e Katıl"}
            </h1>
            <p className="text-gray-400">
              {isLogin ? "Kaldığın yerden devam et." : "Kayıt ol ve analiz etmeye başla."}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl mb-6 text-center shadow-inner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="email"
                name="email"
                placeholder="E-posta adresiniz"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                required
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                name="password"
                placeholder="Şifreniz"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Giriş Yap" : "Hesap Oluştur")}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-sm text-gray-500 font-medium">veya</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google ile devam et
          </button>

          <p className="mt-8 text-center text-sm text-gray-400">
            {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:text-rose-400 font-bold transition-colors"
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}



