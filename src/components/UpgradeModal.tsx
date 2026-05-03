import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
}

export function UpgradeModal({ isOpen, onClose, requiredCredits }: UpgradeModalProps) {
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] px-4"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-indigo-500"></div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-rose-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="w-8 h-8 text-rose-400" />
              </div>

              <h2 className="text-2xl font-bold text-center text-white mb-3">
                Planını Yükselt
              </h2>
              <p className="text-center text-gray-400 mb-8 leading-relaxed">
                Bu işlemi gerçekleştirmek için <strong className="text-white">{requiredCredits} krediye</strong> ihtiyacın var. Sınırları ortadan kaldırmak için Premium'a geç.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/pricing"
                  className="w-full bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  Planları İncele <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3.5 px-4 rounded-xl transition-all"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
