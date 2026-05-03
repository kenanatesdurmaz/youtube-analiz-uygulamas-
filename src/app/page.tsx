"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Video, Sparkles, Brain, Zap, ArrowRight, Loader2, MessageSquare, Send, Coins, LogOut, Crosshair, ListVideo, Scissors, CheckCircle, LayoutDashboard, ArrowLeft, TrendingUp, Briefcase, Users, HelpCircle, ChevronDown, CheckCircle2, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { videoAnalysis } from "@/actions/videoAnalysis";
import { askQuestion } from "@/actions/chat";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ManagePlanModal } from "@/components/ManagePlanModal";
import { checkAndRenewCreditsAction } from "@/actions/renewCredits";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [lastRenewedAt, setLastRenewedAt] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: "user"|"ai", text: string, label?: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Auth & Credit States
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('credits, is_premium, last_renewed_at').eq('id', session.user.id).single();
      if (data) {
        setCredits(data.credits);
        setIsPremium(data.is_premium || false);
        setLastRenewedAt(data.last_renewed_at);
        
        // Check for credit renewal
        if (data.is_premium) {
           const renewalResult = await checkAndRenewCreditsAction();
           if (renewalResult.success && renewalResult.renewed) {
             setCredits(renewalResult.newCredits!);
           }
        }
      }
    }
    setIsAuthLoading(false);
  };

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCredits(0);
    window.location.reload(); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("İşlem yapabilmek için lütfen giriş yapın.");
      return;
    }
    if (credits <= 0) {
      setRequiredCredits(1);
      setShowUpgradeModal(true);
      return;
    }
    if (!url) return;
    
    setLoading(true);
    setError("");
    setResult(null);
    setChatMessages([]);

    const res = await videoAnalysis(url);
    
    if (res.success) {
      setResult(res.data);
      setAnalysisId(res.data.id || null);
      fetchProfile();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.error || "Video analiz edilirken bir hata oluştu.");
    }
    setLoading(false);
  };

  const handleChatSubmit = async (e?: React.FormEvent, customQuestion?: string, cost: number = 1, customLabel?: string) => {
    if (e) e.preventDefault();
    if (!user) {
      setError("Lütfen önce giriş yapın.");
      return;
    }
    if (credits < cost) {
      setRequiredCredits(cost);
      setShowUpgradeModal(true);
      return;
    }
    
    const question = customQuestion || chatInput;
    if (!question || !result?.transcript || isChatting) return;

    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: question, label: customLabel }]);
    setIsChatting(true);

    const res = await askQuestion(result.transcript, question, analysisId || undefined, cost, customLabel);

    if (res.success) {
      setChatMessages(prev => [...prev, { role: "ai", text: res.answer || "" }]);
      fetchProfile();
    } else {
      setChatMessages(prev => [...prev, { role: "ai", text: "Hata: " + res.error }]);
    }
    setIsChatting(false);
  };

  const exportToTxt = () => {
    if (!result) return;
    let content = `Başlık: ${result.title}\nKanal: ${result.channel}\n\n=== TRANSKRİPT ===\n${result.transcript}\n\n=== SOHBET GEÇMİŞİ ===\n`;
    chatMessages.forEach(msg => {
      content += `${msg.role === 'user' ? 'Sen' : 'Yapay Zeka'}: ${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "YouBrain_Analiz.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("YouBrain Analiz Raporu", 10, 10);
    doc.setFontSize(12);
    doc.text(`Baslik: ${result.title.substring(0, 50)}...`, 10, 20);
    doc.text(`Kanal: ${result.channel}`, 10, 30);
    doc.text("Sohbet Gecmisi:", 10, 45);
    let yPos = 55;
    chatMessages.forEach(msg => {
      const text = `${msg.role === 'user' ? 'Sen' : 'AI'}: ${msg.text}`;
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 10, yPos);
      yPos += splitText.length * 7 + 5;
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });
    doc.save("YouBrain_Analiz.pdf");
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-rose-500/30">
      
      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} requiredCredits={requiredCredits} />
      
      {/* Manage Plan Modal */}
      <ManagePlanModal 
        isOpen={showManagePlanModal} 
        onClose={() => setShowManagePlanModal(false)} 
        planName="Premium Yıllık" 
        isPremium={isPremium} 
        lastRenewedAt={lastRenewedAt}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setResult(null); window.scrollTo(0,0);}}>
                <div className="bg-gradient-to-br from-rose-500 to-indigo-600 p-1.5 rounded-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white hidden sm:block">YouBrain</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthLoading && (
              user ? (
                <>
                  {/* Desktop Menu */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">{credits} Kredi</span>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Geçmiş
                    </Link>
                    <button 
                      onClick={() => setShowManagePlanModal(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
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

                  {/* Mobile Menu Button */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full transition-all">
                  Ücretsiz Başla
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden"
            >
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">{credits} Kredi</span>
                  </div>
                  <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold bg-white text-black px-4 py-2 rounded-xl">
                    Kredi Al
                  </Link>
                </div>
                
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 text-gray-300 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5"
                >
                  <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium">Geçmiş Analizler</span>
                </Link>

                <button 
                  onClick={() => { setShowManagePlanModal(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 text-gray-300 hover:text-white transition-colors bg-white/5 rounded-2xl border border-white/5 text-left"
                >
                  <Zap className="w-5 h-5 text-rose-400" />
                  <span className="font-medium">Plan Yönetimi</span>
                </button>

                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/5 rounded-2xl border border-rose-500/10 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Çıkış Yap</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {!result ? (
        <>
          {/* Hero Section */}
          <HeroGeometric 
            badge="Yapay Zeka Destekli YouTube Laboratuvarı"
            title1="Videoları İzlemeyin,"
            title2="Keşfedin ve Çözün."
          >
            <div className="max-w-2xl mx-auto w-full px-4 pt-4">
              <p className="text-lg md:text-xl text-white/60 mb-8 leading-relaxed font-light text-center">
                İzlemek yerine analiz edin. Rakiplerin açıklarını bulun, TikTok kesitleri çıkarın ve videonun ta kendisiyle sohbet edin.
              </p>
              
              {/* Form inside Hero */}
              <form onSubmit={handleSubmit} className="w-full relative group shadow-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative flex flex-col sm:flex-row items-center bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl p-2 gap-2">
                  <div className="hidden sm:block pl-4 text-gray-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={user ? "YouTube linkini buraya yapıştır..." : "Analiz etmek için giriş yapmalısınız."}
                    className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 py-3 sm:py-0 px-4 text-base md:text-lg"
                    required
                    disabled={loading || !user}
                  />
                  <button
                    type="submit"
                    disabled={loading || !user}
                    className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black px-8 py-4 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Analiz <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
              </form>
            </div>
          </HeroGeometric>

          {/* Feature Showcase Scroll Section */}
          <section className="py-32 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="text-center mb-24"
              >
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Sadece Bir Özet Çıkarıcı Değil,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">İçerik Stratejistiniz.</span></h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">YouBrain'in premium araçları sayesinde izleyiciler, içerik üreticileri ve araştırmacılar için paha biçilmez değerler üretilir.</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Crosshair className="w-8 h-8 text-rose-400" />,
                    title: "Rakip Ajanı",
                    desc: "Rakibinin videosunun açıklarını bul, kanca cümlesini analiz et ve ondan daha iyi bir video çekmek için senaryo al."
                  },
                  {
                    icon: <Scissors className="w-8 h-8 text-indigo-400" />,
                    title: "Viral Kesit Avcısı",
                    desc: "2 saatlik bir podcastten TikTok ve Reels'ta viral olacak en vurucu 30 saniyelik bölümleri otomatik olarak tespit et."
                  },
                  {
                    icon: <ListVideo className="w-8 h-8 text-blue-400" />,
                    title: "Otomatik Bölümler",
                    desc: "YouTube açıklaması için konulara göre ayrılmış zaman damgalarını (00:00 - Konu) saniyeler içinde kopyalamaya hazır al."
                  },
                  {
                    icon: <Sparkles className="w-8 h-8 text-amber-400" />,
                    title: "İzleyici Analizi",
                    desc: "Kitlenizin aklındaki soruları ve bir sonraki videonuz için en popüler içerik fikirlerini saniyeler içinde keşfedin."
                  },
                  {
                    icon: <Zap className="w-8 h-8 text-emerald-400" />,
                    title: "Video Sağlık Kontrolü",
                    desc: "Videonuzu YouTube politikalarına ve reklam veren uygunluğuna göre denetleyin, riskli ifadeleri ayıklayın."
                  },
                  {
                    icon: <TrendingUp className="w-8 h-8 text-cyan-400" />,
                    title: "SEO Sihirbazı",
                    desc: "Videonuz için en yüksek tıklanmayı (CTR) getirecek başlık, SEO açıklaması ve viral etiketler üretin."
                  },
                  {
                    icon: <Briefcase className="w-8 h-8 text-fuchsia-400" />,
                    title: "Sponsorluk Avcısı",
                    desc: "Markalara gönderebileceğiniz, videonun kitlesine ve kalitesine özel profesyonel iş birliği mail taslakları alın."
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors"
                  >
                    <div className="bg-white/5 p-4 rounded-2xl inline-block mb-6 border border-white/10">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="py-32 px-6 bg-[#0a0a0a] border-t border-white/5">
            <div className="max-w-5xl mx-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-5xl font-bold">Nasıl Çalışır?</h2>
              </motion.div>

              <div className="space-y-12">
                {[
                  { step: "01", title: "Bağlantıyı Yapıştırın", desc: "Analiz etmek istediğiniz herhangi bir YouTube videosunun linkini kopyalayıp YouBrain'e yapıştırın." },
                  { step: "02", title: "Yapay Zeka Okur", desc: "Apify altyapısı saniyeler içinde videonun tüm altyazısını çeker ve Google Gemini'nin güçlü zihnine aktarır." },
                  { step: "03", title: "Sonuçları Kullanın", desc: "PDF olarak indirin, premium araçlarla analiz edin veya doğrudan soru sormaya başlayın." }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}
                  >
                    <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-3xl font-black text-white/50 shadow-2xl">
                      {item.step}
                    </div>
                    <div className={`flex-1 text-center ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                      <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                      <p className="text-gray-400 text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
           {/* Who is it for Section */}
          <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Kimler İçin Tasarlandı?</h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">YouBrain, zamanı kısıtlı olan ve bilgiyi en verimli şekilde işlemek isteyen profesyonellerin yanındadır.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Users className="w-8 h-8 text-rose-400" />,
                    title: "İçerik Üreticileri",
                    points: ["Viral fikirler keşfedin", "Rakiplerinizi analiz edin", "Shorts içerikleri üretin"]
                  },
                  {
                    icon: <Brain className="w-8 h-8 text-indigo-400" />,
                    title: "Öğrenciler & Araştırmacılar",
                    points: ["Uzun dersleri özetleyin", "Notlarınızı PDF'e dökün", "Önemli noktaları bulun"]
                  },
                  {
                    icon: <Zap className="w-8 h-8 text-amber-400" />,
                    title: "Dijital Pazarlamacılar",
                    points: ["Trendleri yakalayın", "SEO uyumlu metinler", "Pazar araştırması yapın"]
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group"
                  >
                    <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-6 text-white">{item.title}</h3>
                    <ul className="space-y-4">
                      {item.points.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-3 text-gray-400">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-32 px-6 bg-[#050505]">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-6">
                <HelpCircle className="w-8 h-8 text-indigo-400" />
                <h2 className="text-3xl md:text-5xl font-bold">Sıkça Sorulan Sorular</h2>
              </div>
              <p className="text-gray-400 text-center mb-16 text-lg">YouBrain hakkında merak ettiğiniz her şey.</p>

              <div className="space-y-4">
                {[
                  { q: "Kredi sistemi nasıl çalışır?", a: "Her video analizi 1 kredi tüketir. Premium araçlar ise (Viral Kesit, SEO vb.) işlem başına 2 kredi kullanır. Ücretsiz planda her gün 1 kredi hediye edilir." },
                  { q: "Hangi dilleri destekliyor?", a: "Gemini AI altyapımız sayesinde Türkçe, İngilizce, Almanca ve 50'den fazla dilde kusursuz analiz yapabiliyoruz." },
                  { q: "Video uzunluk sınırı var mı?", a: "Hayır! 5 dakikalık bir videoyu da 4 saatlik bir podcast'i de saniyeler içinde analiz edebiliriz." },
                  { q: "Verilerim güvende mi?", a: "Evet, tüm verileriniz Supabase üzerinde şifrelenmiş olarak tutulur ve asla üçüncü şahıslarla paylaşılmaz." }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-lg font-bold text-white">{item.q}</h4>
                      <ChevronDown className={`w-5 h-5 text-gray-500 group-hover:text-white transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {activeFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-400 leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-32 px-6">
            <div className="max-w-5xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-indigo-600 to-rose-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                    İçerik Stratejinizi <br/>Bugün Değiştirin
                  </h2>
                  <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
                    YouBrain ile videoları sadece izlemeyin, onları birer veri kaynağına dönüştürün. İlk analiziniz tamamen ücretsiz.
                  </p>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl flex items-center gap-3 mx-auto"
                  >
                    Ücretsiz Başlayın <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      ) : (
        /* RESULT UI */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto pt-32 pb-24 relative z-10 px-4">
          <button onClick={() => setResult(null)} className="mb-8 text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Yeni Analiz Yap
          </button>
          
          <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
            {result.thumbnail && (
              <div className="w-full md:w-1/3 shrink-0 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 flex items-end p-4">
                   <span className="text-white text-sm font-medium">{result.duration && `⏱ ${result.duration}`}</span>
                </div>
                <img src={result.thumbnail} alt={result.title} className="w-full aspect-video object-cover bg-black/40" />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{result.title}</h2>
                <div className="flex items-center gap-3 text-gray-400 mb-6">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{result.channel}</span>
                  <span className="text-sm">• {result.viewCount?.toLocaleString()} izlenme</span>
                </div>
                
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent shadow-inner">
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {result.transcript ? result.transcript.slice(0, 800) + '...' : 'Transkript bulunamadı.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Tools */}
          <div className="mb-12">
             <div className="flex items-center gap-3 mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-rose-400"/> Premium Araçlar</h3>
               <span className="text-xs font-semibold bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/20">Her Biri 2 Kredi</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={() => handleChatSubmit(undefined, "Bu videoyu rakibim çekmiş. Bu videonun kanca (hook) cümlesi nedir? Zayıf yönleri nelerdir ve ben daha iyisini nasıl çekebilirim? Strateji ver.", 2, "🕵️‍♂️ Rakip Ajanı Analizi İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-rose-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><Crosshair className="w-6 h-6 text-rose-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">🕵️‍♂️ Rakip Ajanı</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Rakibin açıklarını bul ve strateji kur.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videonun konularına göre zaman damgalarını (Örn: 00:00 - Giriş) formatında liste halinde çıkar.", 2, "⏱️ Bölüm Oluşturma İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-blue-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><ListVideo className="w-6 h-6 text-blue-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">⏱️ Bölüm Çıkar</span>
                  <span className="text-sm text-gray-400 leading-relaxed">YouTube için bölüm zaman damgalarını al.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videodan TikTok/Reels için viral olabilecek en vurucu 3 farklı kısa kesit fikri ve zaman aralıklarını (örn: 04:12 - 04:55) detaylıca çıkar.", 2, "✂️ Viral Kesit Çıkarma İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-indigo-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><Scissors className="w-6 h-6 text-indigo-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">✂️ Viral Kesit</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Shorts için viral anları (dakikaları) bul.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videonun transkriptine dayanarak izleyicilerin sorabileceği 5 kritik soruyu ve bu videodan doğabilecek 3 yeni video fikrini çıkar.", 2, "💎 İzleyici Analizi İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-amber-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><Sparkles className="w-6 h-6 text-amber-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">💎 İzleyici Analizi</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Soru tahminleri ve yeni içerik fikirleri.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videoyu YouTube topluluk kuralları ve reklam veren uygunluğu açısından analiz et. Argo, sakıncalı içerik veya telif riski taşıyabilecek ifadeleri tespit et.", 2, "🩺 Sağlık Kontrolü İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-emerald-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><Zap className="w-6 h-6 text-emerald-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">🩺 Sağlık Kontrolü</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Reklam uygunluğu ve politika denetimi.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videonun konusunu analiz et ve YouTube'da en yüksek tıklanma oranını (CTR) getirecek 3 farklı başlık, SEO uyumlu açıklama metni ve 15 adet viral etiket (tag) önerisi sun.", 2, "🚀 SEO Sihirbazı İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-cyan-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><TrendingUp className="w-6 h-6 text-cyan-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">🚀 SEO Sihirbazı</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Başlık, açıklama ve etiket optimizasyonu.</span>
                </button>
                <button onClick={() => handleChatSubmit(undefined, "Bu videonun içeriğini ve hitap ettiği kitleyi analiz ederek, potansiyel sponsorlara (markalara) gönderilmek üzere etkileyici ve profesyonel bir iş birliği e-posta taslağı hazırla.", 2, "📧 Sponsorluk Avcısı İstendi")} disabled={isChatting} className="group p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left flex flex-col disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
                  <div className="bg-fuchsia-500/20 p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform w-max"><Briefcase className="w-6 h-6 text-fuchsia-400" /></div>
                  <span className="font-bold text-white mb-2 text-lg">📧 Sponsorluk Avcısı</span>
                  <span className="text-sm text-gray-400 leading-relaxed">Markalar için profesyonel iş birliği maili.</span>
                </button>
             </div>
          </div>

          {/* Chat Interface */}
          {result.transcript && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500"></div>
              
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                   <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-white">Yapay Zeka ile Sohbet</h3>
                   <p className="text-sm text-gray-400">Video içeriğine dair dilediğiniz soruyu sorun (1 Kredi).</p>
                </div>
              </div>

              <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto mb-8 space-y-6 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 mt-20">
                     <MessageSquare className="w-16 h-16 mb-6 opacity-20" />
                     <p className="text-lg">Sohbete başlamak için yukarıdaki araçları kullanın <br/> veya aşağıya kendi sorunuzu yazın.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl shadow-lg ${msg.role === 'user' ? 'bg-white text-black rounded-br-sm font-medium' : 'bg-white/10 border border-white/10 text-gray-200 rounded-bl-sm leading-relaxed'}`}>
                        {msg.role === 'user' && msg.label ? (
                          <div className="flex items-center gap-2 text-rose-600 font-bold">
                            <Sparkles className="w-5 h-5"/> {msg.label}
                          </div>
                        ) : (
                          <p className="text-[15px] whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl rounded-bl-sm">
                      <div className="flex gap-2 items-center">
                         <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                         <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="relative mt-auto">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Bana videodaki stratejiyi anlat..."
                  className="w-full bg-black/50 border border-white/20 rounded-2xl py-5 pl-6 pr-16 text-white placeholder-gray-500 outline-none focus:border-white/50 transition-all shadow-inner text-lg"
                  disabled={isChatting}
                />
                <button
                  type="submit"
                  disabled={!chatInput || isChatting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-200 rounded-xl text-black transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}







