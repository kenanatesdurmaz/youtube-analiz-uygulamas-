import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Calendar, Zap, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ManagePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  isPremium: boolean;
  lastRenewedAt: string | null;
}

export function ManagePlanModal({ isOpen, onClose, planName, isPremium, lastRenewedAt }: ManagePlanModalProps) {
  const getNextRenewalDate = () => {
    if (!lastRenewedAt) return "Otomatik";
    const date = new Date(lastRenewedAt);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101] px-4"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500"></div>
              
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-500/20 p-3 rounded-2xl">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{isPremium ? "Planım" : "Henüz Bir Planın Yok"}</h2>
                  <p className="text-gray-400">
                    {isPremium ? "Abonelik ayarlarını buradan yönetebilirsin." : "YouBrain Premium'un tüm özelliklerini kullanmak için bir plan seç."}
                  </p>
                </div>
              </div>

              {isPremium ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-sm text-gray-500 uppercase tracking-widest font-bold">Mevcut Plan</span>
                        <h3 className="text-2xl font-black text-white mt-1">{planName}</h3>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                        AKTİF
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm">Kredi yenilenme tarihi: <strong className="text-white">{getNextRenewalDate()}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <span className="text-sm">Ödeme yöntemi: <strong className="text-white">Gumroad</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="https://gumroad.com/library"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-white text-black font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl"
                    >
                      Aboneliği Yönet / İptal Et <ExternalLink className="w-5 h-5" />
                    </a>
                    <p className="text-xs text-gray-500 text-center px-4 leading-relaxed mt-4">
                      Abonelik iptal işlemleri Gumroad paneliniz üzerinden gerçekleştirilmektedir. İptal sonrası mevcut kredileriniz dönem sonuna kadar geçerli kalacaktır.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <p className="text-gray-300 mb-6">
                      Premium plan ile her ay yenilenen kredilere ve tüm profesyonel araçlara sınırsız erişim sağlayabilirsin.
                    </p>
                    <Link
                      href="/pricing"
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      Şimdi Yükselt <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                  <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm">Daha Sonra</button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
