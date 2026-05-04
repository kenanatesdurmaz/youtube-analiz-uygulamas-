"use client";

import { motion } from "framer-motion";
import { Sparkles, Play, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Background Decor */}
      <div className="glow-purple -top-40 -left-40 animate-pulse" />
      <div className="glow-red -bottom-40 -right-40" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#FF2B54] rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Play className="w-6 h-6 text-white fill-white/20" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">YouBrain</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">Özellikler</Link>
            <Link href="/pricing" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">Fiyatlandırma</Link>
          </div>

          <Link 
            href="/login" 
            className="px-7 py-3 bg-black text-white rounded-full text-sm font-bold hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            Hemen Başla
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF2B54]/5 border border-[#FF2B54]/10 text-[#FF2B54] text-xs font-black uppercase tracking-widest mb-10"
          >
            <Sparkles className="w-4 h-4" />
            <span>Yapay Zeka Destekli YouTube Analizi</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-[900] text-black mb-10 tracking-tight leading-[1.05]"
          >
            YouTube Videolarını <br />
            <span className="text-[#FF2B54]">Saniyeler İçinde</span> Çözün.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Saatlerce süren videoları izlemeyi bırakın. YouBrain ile videonun özünü yakalayın, sorular sorun ve içeriği anında anlayın.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login" className="primary-button flex items-center gap-2 text-lg px-10 py-5">
              Ücretsiz Deneyin <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-10 py-5 bg-gray-100 text-gray-900 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-sm">
              <Play className="w-5 h-5 fill-current" /> Nasıl Çalışır?
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main Feature Cards */}
      <section id="features" className="section-padding bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8 text-[#FF2B54]" />,
              title: "Işık Hızında Özet",
              description: "Herhangi bir YouTube videosunun ana fikirlerini ve önemli noktalarını saniyeler içinde alın."
            },
            {
              icon: <Zap className="w-8 h-8 text-indigo-500" />,
              title: "Video ile Sohbet",
              description: "Videonun içeriğine dair sorular sorun ve yapay zekadan anında yanıtlar alın."
            },
            {
              icon: <Check className="w-8 h-8 text-emerald-500" />,
              title: "Transkript Analizi",
              description: "Videonun tam metnini inceleyin ve istediğiniz bölümlere anında odaklanın."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-12 rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-8 border border-black/5 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-black mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto rounded-[56px] bg-black p-24 text-center relative overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FF2B54]/10 rounded-full blur-[120px]" />
          
          <h2 className="text-4xl md:text-7xl font-black text-white mb-10 relative z-10 tracking-tight leading-tight">
            Daha Akıllıca Analiz <br /> Etmeye Başlayın.
          </h2>
          <p className="text-xl text-gray-400 mb-14 max-w-2xl mx-auto relative z-10 font-medium">
            Kanal sahipleri, öğrenciler ve profesyoneller için YouTube'u bir bilgi kütüphanesine dönüştürüyoruz.
          </p>
          <Link href="/login" className="inline-flex px-14 py-6 bg-[#FF2B54] text-white rounded-full font-extrabold text-xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,43,84,0.3)] relative z-10 active:scale-95">
            Ücretsiz Hesabını Oluştur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-black/5 text-center text-gray-400 font-semibold tracking-wide uppercase text-xs">
        <p>© 2026 YouBrain — Geleceğin Video Analiz Platformu</p>
      </footer>
    </div>
  );
}
