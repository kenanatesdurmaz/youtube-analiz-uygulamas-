"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Check, Zap, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ManagePlanModal } from "@/components/ManagePlanModal";

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [lastRenewedAt, setLastRenewedAt] = useState<string | null>(null);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      // Use getSession for faster/persistent check, then getUser for security
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;
      setUser(authUser);
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, is_premium, last_renewed_at')
          .eq('id', authUser.id)
          .single();
        
        if (profile) {
          setCredits(profile.credits || 0);
          setIsPremium(profile.is_premium || false);
          setLastRenewedAt(profile.last_renewed_at);
        }
      }
      setIsAuthLoading(false);
    }
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const products = [
    {
      id: "ryaoa",
      name: "Premium",
      credits: 100,
      price: "$9.99",
      period: "Yıllık",
      features: [
        "100 Kredi (Her Ay Yenilenir)", 
        "Standart Sohbet (1 Kredi)", 
        "Premium Araç Kullanımı (2 Kredi)", 
        "Sınırsız Transkript İndirme", 
        "Gemini 2.5 Flash Hızı",
        "7/24 Öncelikli Destek"
      ],
      color: "from-rose-500 to-indigo-600",
      popular: true
    }
  ];

  const getCheckoutUrl = (productId: string) => {
    const userId = user?.id;
    if (!userId) return `https://kenanate.gumroad.com/l/${productId}`;
    return `https://kenanate.gumroad.com/l/${productId}?user_id=${userId}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white fill-white/10" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">YouBrain</span>
          </Link>

          <div className="flex items-center gap-6">
            {!isAuthLoading && (
              user ? (
                <div className="flex items-center gap-5">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-gray-300 hover:text-white transition-all">
                    <Zap className="w-4 h-4 text-rose-400" /> {credits} Kredi
                  </button>
                  <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-rose-400 transition-colors" title="Çıkış Yap">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Giriş Yap</Link>
                  <Link href="/login" className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5">Hemen Başla</Link>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto pt-40 pb-32 px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fiyatlandırma</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter"
          >
            Analiz Kapasiteni <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-500">Zirveye Taşı</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 font-medium leading-relaxed"
          >
            Sınırları ortadan kaldırın. Premium plan ile en gelişmiş AI modellerine öncelikli erişim sağlayın ve iş akışınızı hızlandırın.
          </motion.p>
        </div>

        <div className="flex justify-center max-w-xl mx-auto w-full">
          {products.map((product, idx) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`relative bg-[#0A0A0A]/60 border ${isPremium ? 'border-green-500/40 shadow-[0_0_60px_-15px_rgba(34,197,94,0.15)]' : 'border-white/10 shadow-2xl'} backdrop-blur-2xl rounded-[3rem] p-12 text-left flex flex-col w-full group transition-all duration-700 hover:border-white/20`}
            >
              {isPremium && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-[0.25em] animate-pulse z-20">
                  Aktif Abonelik
                </div>
              )}
              
              <div className="flex items-center gap-5 mb-12">
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${isPremium ? 'from-green-500 to-emerald-600' : 'from-rose-500 to-indigo-600'} shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                  <Zap className="w-8 h-8 text-white fill-white/10" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{product.name}</h3>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest">En Güçlü Plan</p>
                </div>
              </div>
              
              <div className="mb-12">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-white tracking-tighter">{product.price}</span>
                  <span className="text-gray-500 text-xl font-bold">/{product.period}</span>
                </div>
              </div>

              <div className="space-y-6 mb-12 flex-1">
                {product.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-4 text-gray-300 group/item">
                    <div className={`p-1.5 rounded-full ${isPremium ? 'bg-green-500/10' : 'bg-rose-500/10'} group-hover/item:scale-125 transition-transform duration-300`}>
                      <Check className={`w-4 h-4 ${isPremium ? 'text-green-400' : 'text-rose-400'}`} />
                    </div>
                    <span className="text-[16px] font-medium group-hover/item:text-white transition-colors leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {!isAuthLoading ? (
                user ? (
                  isPremium ? (
                    <button
                      disabled
                      className="w-full bg-green-500/10 border border-green-500/20 text-green-500 py-6 rounded-2xl font-black text-lg flex justify-center items-center gap-3 cursor-default shadow-inner"
                    >
                      <Check className="w-6 h-6" /> Aboneliğiniz Aktif
                    </button>
                  ) : (
                    <a
                      href={getCheckoutUrl(product.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center bg-white text-black hover:bg-gray-100 py-6 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-3 shadow-2xl hover:shadow-white/20 active:scale-95 group/btn"
                    >
                      Hemen Yükselt
                      <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </a>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white py-6 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-3"
                  >
                    Giriş Yap ve Satın Al
                  </Link>
                )
              ) : (
                <div className="w-full py-6 bg-white/5 rounded-2xl animate-pulse flex justify-center">
                  <div className="w-32 h-6 bg-white/10 rounded-full"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <ManagePlanModal 
        isOpen={showManagePlanModal} 
        onClose={() => setShowManagePlanModal(false)} 
        planName="Premium Yıllık" 
        isPremium={isPremium} 
        lastRenewedAt={lastRenewedAt}
      />
    </div>
  );
}
