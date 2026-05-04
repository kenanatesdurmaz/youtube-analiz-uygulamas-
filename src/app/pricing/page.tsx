"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Check, Zap, Play, LayoutDashboard, Coins, LogOut, ArrowLeft } from "lucide-react";
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, is_premium, last_renewed_at')
          .eq('id', user.id)
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

    // Listen for Gumroad success event
    const handleMessage = (event: MessageEvent) => {
      // Log for debugging
      console.log("Message received from:", event.origin, "Data:", event.data);

      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { /* ignore */ }
      }

      // Check for any sign of a successful sale
      const isSale = 
        data === "sale" || 
        data.event === "gumroad.sale" || 
        data.message === "sale" || 
        (typeof data === 'string' && data.includes("sale"));

      if (isSale) {
        console.log("Gumroad sale detected via message! Redirecting...");
        router.push("/success");
      }
    };

    // Foolproof Backup: Poll for credit increase
    let initialCredits = -1;
    const creditInterval = setInterval(async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        if (initialCredits === -1) {
          initialCredits = profile.credits || 0;
        } else if (profile.credits > initialCredits) {
          console.log("Credit increase detected! Payment successful.");
          clearInterval(creditInterval);
          router.push("/success");
        }
      }
    }, 3000); // Check every 3 seconds

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(creditInterval);
    };
  }, [supabase, router, user]);

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
      features: ["100 Kredi (Her Ay Yenilenir)", "Standart Sohbet (1 Kredi)", "Premium Araç Kullanımı (2 Kredi)", "Sınırsız Transkript İndirme", "Gemini 2.5 Flash Hızı"],
      color: "from-rose-500 to-indigo-600",
      popular: true
    }
  ];

  const getCheckoutUrl = (productId: string) => {
    return `https://kenanate.gumroad.com/l/${productId}?custom_fields[user_id]=${user?.id || ""}`;
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-rose-500/30 relative">
      {/* Navigation (Matched with Home Page) */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4"><button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button><Link href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-500 to-indigo-600 p-1.5 rounded-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">YouBrain</span></Link></div>

          <div className="flex items-center gap-4">
            {!isAuthLoading && (
              user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">{credits} Kredi</span>
                  </div>
                  <button 
                    onClick={() => setShowManagePlanModal(true)}
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    <Zap className="w-4 h-4 text-indigo-400" /> Planlarım
                  </button>
                  <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Geçmiş
                  </Link>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Çıkış Yap">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Giriş
                  </Link>
                  <Link href="/login" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full transition-all">
                    Ücretsiz Başla
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto text-center pt-40 pb-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>Esnek Fiyatlandırma, Taahhüt Yok</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-6"
        >
          Kullandıkça Öde, <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-indigo-500">
            Sınırları Ortadan Kaldır
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-400 mb-16 max-w-2xl mx-auto"
        >
          Premium plan ile sınırları zorlayın. Yıllık abonelik ile her ay kredileriniz otomatik olarak yenilensin.
        </motion.p>

        <div className="flex justify-center max-w-xl mx-auto w-full">
          {products.map((product, idx) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`relative bg-white/5 border ${product.popular ? 'border-rose-500/50' : 'border-white/10'} backdrop-blur-md rounded-3xl p-8 text-left flex flex-col shadow-2xl`}
            >
              {product.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  EN ÇOK TERCİH EDİLEN
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${product.color} bg-opacity-20`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{product.name}</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-white">{product.price}</span>
                <span className="text-gray-400 text-xl"> / {product.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {product.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <a
                  href={getCheckoutUrl(product.id)}
                  data-redirect-url="https://youtube-analiz-uygulamas-kenanatesdurmazs-projects.vercel.app/success"
                  className={`gumroad-button w-full text-center bg-gradient-to-r ${product.color} hover:opacity-90 text-white py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg`}
                >
                  Satın Al <ArrowRight className="w-5 h-5" />
                </a>
              ) : (
                <Link
                  href="/login"
                  className="w-full text-center bg-white/10 hover:bg-white/20 border border-white/10 text-white py-4 rounded-xl font-bold transition-all"
                >
                  Satın Almak İçin Giriş Yap
                </Link>
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



