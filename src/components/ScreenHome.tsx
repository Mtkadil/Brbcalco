import { motion } from 'motion/react';
import { DollarSign, Eye } from 'lucide-react';
// @ts-expect-error - image import handled by vite
import logoImage from '../assets/images/block_barber_logo_1779524464059.png';

interface ScreenHomeProps {
  onNavigate: (screen: 'selection-screen' | 'admin-dashboard') => void;
}

export default function ScreenHome({ onNavigate }: ScreenHomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full text-center"
    >
      <div className="flex justify-center mb-8">
        <div className="relative p-2.5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(215,180,60,0.1)]">
          <img
            src={logoImage}
            alt="Block Barber Logo"
            className="h-28 w-auto object-contain brightness-110 select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <h2 className="font-serif text-2xl tracking-[0.2em] font-bold text-gold-primary mb-1 uppercase">
        Benvenuto
      </h2>
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#8E8E93] mb-12">
        Seleziona modulo operativo
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onNavigate('selection-screen')}
          className="w-full bg-gradient-to-br from-[#D4AF37] via-[#FCF6BA] to-[#B38728] hover:brightness-110 active:scale-[0.98] transition-all text-black font-bold rounded-2xl py-4 flex items-center justify-center gap-2.5 shadow-lg shadow-amber-900/20 cursor-pointer text-base font-sans"
        >
          <DollarSign className="w-5 h-5 stroke-[2.5]" />
          Accedi alle Sedie
        </button>

        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-[#F5F5F7] hover:scale-[1.01] active:scale-[0.98] transition-all font-semibold rounded-2xl py-4 flex items-center justify-center gap-2.5 cursor-pointer text-base font-sans"
        >
          <Eye className="w-5 h-5 stroke-[2]" />
          Dashboard Proprietario
        </button>
      </div>
    </motion.div>
  );
}
