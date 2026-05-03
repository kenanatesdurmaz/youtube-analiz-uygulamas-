"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Play, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function SuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const supabase = createClient();

  useEffect(() => {
    const updateCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus('error');
        return;
      }

      // In a real app, this should be verified via a session_id or server action
      // For this test/demo, we'll use a server action to securely add credits
      try {
        // We call a server action to bypass RLS and add 100 credits
        const response = await fetch('/api/dev/topup', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, amount: 100 }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (e) {
        setStatus('error');
      }
    };

    updateCredits();
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        
        {status === 'loading' ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Ödeme Doğrulanıyor...</h2>
            <p className="text-gray-400">Kredileriniz hesabınıza tanımlanıyor, lütfen bekleyin.</p>
          </div>
        ) : status === 'success' ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="bg-emerald-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Ödeme Başarılı!</h2>
            <p className="text-gray-400 mb-10 leading-relaxed">
              100 Premium Kredi hesabınıza başarıyla tanımlandı. Artık YouBrain'in tüm gücünü kullanmaya hazırsınız.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
              Dashboard'a Git <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          <div>
            <div className="bg-red-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Play className="w-12 h-12 text-red-400 rotate-90" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bir Hata Oluştu</h2>
            <p className="text-gray-400 mb-8">Kredileriniz tanımlanırken bir sorun oluştu. Lütfen destek ile iletişime geçin.</p>
            <Link href="/pricing" className="text-indigo-400 hover:underline">Tekrar Dene</Link>
          </div>
        )}
      </div>
    </div>
  );
}
