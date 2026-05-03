import Link from "next/link";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 blur-[80px] pointer-events-none" />
        
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 animate-bounce-subtle">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Ödeme Başarılı!</h1>
          <p className="text-gray-400">
            Kredileriniz hesabınıza başarıyla tanımlandı. Artık videolarınızı analiz etmeye devam edebilirsiniz.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link 
            href="/dashboard"
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
          >
            Analizlere Başla
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/"
            className="w-full py-4 bg-white/5 text-white font-medium rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
        </div>

        <p className="text-xs text-gray-500 pt-4">
          Bir sorun mu yaşıyorsunuz? Bize ulaşmaktan çekinmeyin.
        </p>
      </div>
    </div>
  );
}
