"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Brain, Send, Loader2, Sparkles, Crosshair, ListVideo, Scissors, Play, LayoutDashboard, Coins, LogOut, MessageSquare, TrendingUp, Briefcase, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { askQuestion } from "@/actions/chat";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ManagePlanModal } from "@/components/ManagePlanModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { checkAndRenewCreditsAction } from "@/actions/renewCredits";

export default function AnalysisDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [lastRenewedAt, setLastRenewedAt] = useState<string | null>(null);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(1);

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: "user"|"ai", text: string, label?: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase.from('profiles').select('credits, is_premium').eq('id', session.user.id).single();
        if (profileData) {
          setCredits(profileData.credits);
          setIsPremium(profileData.is_premium || false);
          setLastRenewedAt(profileData.last_renewed_at);

          // Check for credit renewal
          if (profileData.is_premium) {
            const renewalResult = await checkAndRenewCreditsAction();
            if (renewalResult.success && renewalResult.renewed) {
              setCredits(renewalResult.newCredits!);
            }
          }
        }
        
        const { data: analysisData } = await supabase.from('analyses').select('*').eq('id', id).eq('user_id', session.user.id).single();
        if (analysisData) {
          setAnalysis(analysisData);
          if (analysisData.chat_history) {
            setChatMessages(analysisData.chat_history);
          }
        }
      }
      setIsAuthLoading(false);
      setLoading(false);
    };
    initData();
  }, [id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const fetchProfile = async () => {
    if (user) {
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (data) setCredits(data.credits);
    }
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
    if (!question || !analysis?.transcript || isChatting) return;

    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: question, label: customLabel }]);
    setIsChatting(true);
    setError("");

    const res = await askQuestion(analysis.transcript, question, id as string, cost, customLabel);

    if (res.success) {
      setChatMessages(prev => [...prev, { role: "ai", text: res.answer || "" }]);
      fetchProfile();
    } else {
      setChatMessages(prev => [...prev, { role: "ai", text: "Hata: " + res.error }]);
    }
    setIsChatting(false);
  };

  const exportToTxt = () => {
    if (!analysis) return;
    let content = `Başlık: ${analysis.title}\nKanal: ${analysis.channel}\n\n=== TRANSKRİPT ===\n${analysis.transcript}\n\n=== SOHBET GEÇMİŞİ ===\n`;
    chatMessages.forEach(msg => {
      content += `${msg.role === 'user' ? 'Sen' : 'Yapay Zeka'}: ${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `YouBrain_${analysis.title.substring(0, 15)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("YouBrain Analiz Raporu", 10, 10);
    doc.setFontSize(12);
    doc.text(`Baslik: ${analysis.title.substring(0, 50)}...`, 10, 20);
    doc.text(`Kanal: ${analysis.channel}`, 10, 30);
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
    doc.save(`YouBrain_${analysis.title.substring(0, 15)}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Analiz Bulunamadı</h1>
        <Link href="/dashboard" className="text-rose-400 hover:text-rose-300 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Geçmişe Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-rose-500/30">
      <ManagePlanModal 
        isOpen={showManagePlanModal} 
        onClose={() => setShowManagePlanModal(false)} 
        planName="Premium Yıllık" 
        isPremium={isPremium} 
        lastRenewedAt={lastRenewedAt}
      />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} requiredCredits={requiredCredits} />
      
      {/* Navigation */}
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
                  <Link href="/pricing" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-full transition-all">
                    Kredi Al
                  </Link>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Çıkış Yap">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full transition-all">
                  Ücretsiz Başla
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto pt-32 pb-24 relative z-10 px-4">
        <Link href="/dashboard" className="mb-8 text-gray-400 hover:text-white flex items-center gap-2 w-max bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Geçmişe Dön
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
          {analysis.thumbnail && (
            <div className="w-full md:w-1/3 shrink-0 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 flex items-end p-4">
                 <span className="text-white text-sm font-medium">{analysis.duration && `⏱ ${analysis.duration}`}</span>
              </div>
              <img src={analysis.thumbnail} alt={analysis.title} className="w-full aspect-video object-cover bg-black/40" />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{analysis.title}</h2>
              <div className="flex items-center gap-3 text-gray-400 mb-6">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{analysis.channel}</span>
                <span className="text-sm">• {new Intl.DateTimeFormat('tr-TR').format(new Date(analysis.created_at))}</span>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent shadow-inner">
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {analysis.transcript ? analysis.transcript.slice(0, 800) + '...' : 'Transkript bulunamadı.'}
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
        {analysis.transcript && (
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
              {error && <p className="text-rose-400 text-sm mb-3 absolute -top-8 left-0">{error}</p>}
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Sorunuzu buraya yazın..."
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
    </div>
  );
}






