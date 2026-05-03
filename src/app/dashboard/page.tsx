"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, Video, MessageSquare, Play, LayoutDashboard, Coins, LogOut, ArrowLeft, Trash2, AlertTriangle, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteAnalysisAction } from "@/actions/deleteAnalysis";
import { ManagePlanModal } from "@/components/ManagePlanModal";
import { checkAndRenewCreditsAction } from "@/actions/renewCredits";
import { StatsBanner } from "@/components/StatsBanner";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [lastRenewedAt, setLastRenewedAt] = useState<string | null>(null);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    
    // Optimistic UI update
    setAnalyses(prev => prev.filter(item => item.id !== id));
    
    // Delete using Server Action to bypass RLS
    const result = await deleteAnalysisAction(id);
    if (!result.success) {
      console.error("Silme hatası:", result.error);
      alert("Silinirken bir hata oluştu: " + result.error);
    }
  };

  useEffect(() => {
    const fetchAnalyses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase.from('profiles').select('credits, is_premium, last_renewed_at, total_xp').eq('id', user.id).single();
        if (profileData) {
          setCredits(profileData.credits);
          setIsPremium(profileData.is_premium || false);
          setTotalXp(profileData.total_xp || 0);
          setLastRenewedAt(profileData.last_renewed_at);

          // Check for credit renewal
          if (profileData.is_premium) {
            const renewalResult = await checkAndRenewCreditsAction();
            if (renewalResult.success && renewalResult.renewed) {
              setCredits(renewalResult.newCredits!);
            }
          }
        }

        const { data } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setAnalyses(data);
      }
      setLoading(false);
    };
    fetchAnalyses();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  return (
    <div className="relative min-h-screen pt-32 pb-16 px-4 bg-[#030303] text-white overflow-hidden font-sans selection:bg-rose-500/30">
      {/* Navigation (Matched with Home Page) */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4"><button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button><Link href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-500 to-indigo-600 p-1.5 rounded-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">YouBrain</span></Link></div>

          <div className="flex items-center gap-4">
            {!loading && (
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
                  <Link href="/pricing" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-full transition-all">
                    Kredi Al
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
            Analiz <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-500">Geçmişi</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            Şu ana kadar yaptığın tüm analizleri ve biriktirdiğin bilgileri buradan yönetebilirsin.
          </p>
        </header>

        {/* Stats Banner */}
        {!loading && analyses.length > 0 && (
          <StatsBanner 
            totalAnalyses={analyses.length} 
            totalWords={analyses.reduce((acc, curr) => acc + (curr.transcript?.split(/\s+/).length || 0), 0)} 
            totalDurationSeconds={analyses.reduce((acc, curr) => acc + (curr.duration || 0), 0)}
            totalXp={totalXp}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Henüz analiz bulunmuyor</h2>
            <p className="text-gray-400 mb-6">İlk videonuzu analiz ederek başlayın.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-indigo-600 px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity">
              Ana Sayfaya Dön <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:bg-white/10 transition-colors flex flex-col shadow-xl"
              >
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full h-48 object-cover border-b border-white/10" />
                ) : (
                  <div className="w-full h-48 bg-black/50 flex items-center justify-center border-b border-white/10">
                    <Video className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={item.title}>
                    {item.title || "İsimsiz Video"}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                    <span className="bg-white/10 px-2.5 py-1 rounded-full">{item.channel}</span>
                    <span>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.created_at))}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                      <span>{item.chat_history?.length ? item.chat_history.length / 2 : 0} Soru</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                        title="Analizi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/dashboard/${item.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors"
                      >
                        İncele <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setItemToDelete(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] px-4">
              <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                <div className="bg-rose-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"><AlertTriangle className="w-8 h-8 text-rose-500" /></div>
                <h3 className="text-2xl font-bold text-center text-white mb-2">Analizi Sil?</h3>
                <p className="text-center text-gray-400 mb-8 leading-relaxed">Bu analizi ve tüm sohbet geçmişini kalıcı olarak silmek istediğinizden emin misiniz?</p>
                <div className="flex flex-col gap-3">
                  <button onClick={confirmDelete} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">Kalıcı Olarak Sil</button>
                  <button onClick={() => setItemToDelete(null)} className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3.5 rounded-xl transition-all">Vazgeç</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
