import { useState, useRef, FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { CHAIR_NAMES_MAP } from '../types';

interface ScreenChairProps {
  chairNum: number;
  total: number;
  history?: Array<{ id: string; amount: number; timestamp: string }>;
  onAddAmount: (amount: number) => Promise<void>;
  onExit: () => void;
}

export default function ScreenChair({ chairNum, total, history = [], onAddAmount, onExit }: ScreenChairProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [triggerCountEffect, setTriggerCountEffect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickAdd = async (amount: number) => {
    setTriggerCountEffect(true);
    setTimeout(() => setTriggerCountEffect(false), 200);
    await onAddAmount(amount);
  };

  const handleCustomAdd = async (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      setTriggerCountEffect(true);
      setTimeout(() => setTriggerCountEffect(false), 200);
      await onAddAmount(amount);
      setCustomAmount('');
      if (inputRef.current) {
        inputRef.current.blur(); // Closes software keyboard on mobile
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full text-center"
    >
      <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#8E8E93] mb-1">
        Postazione di
      </h2>
      <p className="font-serif text-3xl font-bold tracking-[2px] text-gold-primary uppercase mb-4">
        {CHAIR_NAMES_MAP[chairNum]}
      </p>

      {/* Large scale feedback counter wrapper */}
      <motion.div
        animate={{ scale: triggerCountEffect ? 1.08 : 1 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        className="text-6xl sm:text-7xl font-light tracking-tighter text-white my-6 tabular-nums flex items-center justify-center"
      >
        <span className="text-2xl sm:text-3xl align-top mr-1 opacity-40 font-sans">€</span>
        <AnimatedCounter value={total} />
      </motion.div>

      {/* Quick Fast Add Buttons */}
      <div className="grid grid-cols-2 gap-3.5 mb-6">
        {[10, 15, 20, 25].map((amount) => {
          const isPremium = amount === 10 || amount === 25;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAdd(amount)}
              className={
                isPremium
                  ? "bg-gradient-to-br from-[#D4AF37] via-[#FCF6BA] to-[#B38728] text-black font-extrabold rounded-2xl py-6 text-2xl shadow-lg shadow-amber-950/20 active:scale-95 transition-all cursor-pointer font-sans"
                  : "bg-white/10 hover:bg-white/15 border border-white/5 text-white font-bold rounded-2xl py-6 text-2xl active:scale-95 transition-all cursor-pointer font-sans"
              }
            >
              +{amount}€
            </button>
          );
        })}
      </div>

      {/* Custom Amount Form */}
      <form onSubmit={handleCustomAdd} className="flex gap-2.5 mb-8">
        <input
          ref={inputRef}
          type="number"
          placeholder="Altra Cifra"
          inputMode="numeric"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-2xl px-5 py-4 text-center text-xl text-[#D4AF37] placeholder:text-[#8E8E93]/30 focus:outline-none transition-all font-sans"
        />
        <button
          type="submit"
          className="bg-white/10 border border-white/10 hover:bg-white/15 text-white hover:text-white font-semibold rounded-2xl px-6 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer font-sans text-xs whitespace-nowrap uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Custom
        </button>
      </form>

      {/* Daily Transaction History */}
      <div className="mb-8 text-left">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] mb-3 font-semibold pl-1">
          Cronologia del Giorno
        </h3>
        {history.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl py-5 px-4 text-center text-xs text-[#8E8E93]/60 italic font-sans">
            Nessuna operazione registrata oggi
          </div>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {history.map((item) => {
              const itemTime = new Date(item.timestamp).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              return (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 flex justify-between items-center transition-all"
                >
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">
                    {itemTime}
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-sans">
                    +{item.amount}€
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={onExit}
        className="text-[#8E8E93] hover:text-gold-primary text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer font-sans"
      >
        <ArrowLeft className="w-4 h-4" />
        Esci dalla sedia
      </button>
    </motion.div>
  );
}
