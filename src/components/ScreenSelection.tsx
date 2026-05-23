import { motion } from 'motion/react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { CHAIR_NAMES_MAP } from '../types';
// @ts-expect-error - image import handled by vite
import logoImage from '../assets/images/block_barber_logo_1779524464059.png';

interface ScreenSelectionProps {
  onSelectChair: (chairNum: number) => void;
  isAdminMode?: boolean;
  onBack: () => void;
}

export default function ScreenSelection({ onSelectChair, isAdminMode = false, onBack }: ScreenSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full text-center animate-fade-in"
    >
      <div className="flex justify-center mb-4">
        <img
          src={logoImage}
          alt="Block Barber"
          className="h-16 w-auto object-contain brightness-110 filter hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>

      <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] mb-8 font-semibold">
        Seleziona postazione di lavoro
      </h2>

      <div className="grid grid-cols-1 gap-3.5 mb-8">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            onClick={() => onSelectChair(num)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-stone-200 hover:text-white rounded-2xl py-4 flex items-center justify-between px-6 transition-all group cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 group-hover:border-white/15 transition-all">
                <Scissors className="w-5 h-5 text-gold-primary" />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-widest text-[#8E8E93] font-mono">Postazione 0{num}</p>
                <p className="font-serif text-base text-stone-200 group-hover:text-gold-primary transition-colors">{CHAIR_NAMES_MAP[num]}</p>
              </div>
            </div>
            <span className="text-stone-500 font-sans text-xs group-hover:text-stone-300 transition-colors">
              Scegli &rarr;
            </span>
          </button>
        ))}
      </div>

      {isAdminMode ? (
        <button
          onClick={onBack}
          className="text-[#8E8E93] hover:text-gold-primary text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Home
        </button>
      ) : (
        <div className="text-[9px] uppercase tracking-[0.25em] text-[#8E8E93]/50">
          Terminale Operatori &bull; Connesso alla Cassa
        </div>
      )}
    </motion.div>
  );
}
