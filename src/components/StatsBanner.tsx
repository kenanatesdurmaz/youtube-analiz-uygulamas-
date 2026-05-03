import { motion } from "framer-motion";
import { Clock, BookOpen, Zap, TrendingUp } from "lucide-react";

interface StatsBannerProps {
  totalAnalyses: number;
  totalWords: number;
  totalDurationSeconds: number;
  totalXp: number;
}

export function StatsBanner({ totalAnalyses, totalWords, totalDurationSeconds, totalXp }: StatsBannerProps) {
  // Use actual duration if available, otherwise fallback to 15m estimate for old records
  const effectiveDuration = totalDurationSeconds > 0 ? totalDurationSeconds : (totalAnalyses * 15 * 60);
  const hours = Math.floor(effectiveDuration / 3600);
  const minutes = Math.floor((effectiveDuration % 3600) / 60);

  // Level calculation based on XP (e.g., Level 1: 0-100, Level 2: 100-300...)
  const level = Math.floor(totalXp / 100) + 1;
  const progressToNextLevel = totalXp % 100;

  const stats = [
    {
      label: "Kazanılan Zaman",
      value: hours > 0 ? `${hours}s ${minutes}dk` : `${minutes}dk`,
      icon: Clock,
      color: "from-emerald-500 to-teal-500",
      description: "Video izlemekten tasarruf edildi"
    },
    {
      label: "Analiz Edilen İçerik",
      value: totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords,
      icon: BookOpen,
      color: "from-blue-500 to-indigo-500",
      description: "Toplam kelime okundu"
    },
    {
      label: `Üretkenlik (Seviye ${level})`,
      value: `${totalXp} XP`,
      icon: TrendingUp,
      color: "from-rose-500 to-orange-500",
      description: `Sonraki seviyeye ${100 - progressToNextLevel} XP kaldı`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative group cursor-default"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r opacity-20 group-hover:opacity-100 transition duration-500 blur-xl rounded-3xl" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}></div>
          <div className="relative bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] flex flex-col h-full hover:border-white/10 transition-colors overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-white/30 group-hover:text-white/100 transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
            
            <p className="text-xs text-gray-600 mt-4 font-medium leading-relaxed">
              {stat.description}
            </p>
            
            {/* Subtle background glow */}
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-[0.03] blur-2xl rounded-full`}></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
