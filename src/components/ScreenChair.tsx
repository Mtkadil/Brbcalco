import { useState, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { CHAIR_NAMES_MAP } from '../types';

interface ScreenChairProps {
  chairNum: number;
  total: number;
  history?: Array<{ id: string; amount: number; timestamp: string }>;
  onAddAmount: (amount: number) => Promise<void>;
  onUndoRecentTransaction?: () => Promise<void>;
  onExit: () => void;
  isAdminMode?: boolean;
}

export default function ScreenChair({
  chairNum,
  total,
  history = [],
  onAddAmount,
  onUndoRecentTransaction,
  onExit,
  isAdminMode = false
}: ScreenChairProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [triggerCountEffect, setTriggerCountEffect] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUndoConfirm = async () => {
    if (onUndoRecentTransaction) {
      setIsUndoing(true);
      setSaveError('');
      try {
        await onUndoRecentTransaction();
      } catch (err) {
        console.error('Errore durante l\'annullamento:', err);
        setSaveError("Impossibile annullare l'operazione. Verifica la connessione.");
      } finally {
        setIsUndoing(false);
        setShowUndoConfirm(false);
      }
    }
  };

  const recentTransaction = history.length > 0 ? history[0] : null;
  const recentTransactionTime = recentTransaction
    ? new Date(recentTransaction.timestamp).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  const handleQuickAdd = async (amount: number) => {
    if (isSaving) return;
    setSaveError('');
    setIsSaving(true);
    setTriggerCountEffect(true);
    setTimeout(() => setTriggerCountEffect(false), 200);
    try {
      await onAddAmount(amount);
    } catch (err) {
      console.error('Errore durante il salvataggio rapido:', err);
      setSaveError("Connessione instabile. Riprova a premere il bottone.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSaveError('');
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      setIsSaving(true);
      setTriggerCountEffect(true);
      setTimeout(() => setTriggerCountEffect(false), 200);
      try {
        await onAddAmount(amount);
        setCustomAmount('');
        if (inputRef.current) {
          inputRef.current.blur(); // Closes software keyboard on mobile
        }
      } catch (err) {
        console.error('Errore durante il salvataggio custom:', err);
        setSaveError("Connessione instabile. Riprova a premere il bottone.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setSaveError("Inserisci una cifra valida superiore a 0.");
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
              disabled={isSaving}
              onClick={() => handleQuickAdd(amount)}
              className={
                isPremium
                  ? "bg-gradient-to-br from-[#D4AF37] via-[#FCF6BA] to-[#B38728] text-black font-extrabold rounded-2xl py-6 text-2xl shadow-lg shadow-amber-950/20 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all cursor-pointer font-sans"
                  : "bg-white/10 hover:bg-white/15 border border-white/5 text-white font-bold rounded-2xl py-6 text-2xl active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all cursor-pointer font-sans"
              }
            >
              +{amount}€
            </button>
          );
        })}
      </div>

      {/* Local Save Error Banner */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-3.5 mb-5 text-[11px] font-semibold text-left font-sans flex items-start gap-2.5"
          >
            <span>⚠️</span>
            <span className="leading-relaxed flex-1">{saveError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Amount Form */}
      <form onSubmit={handleCustomAdd} className="flex gap-2.5 mb-8">
        <input
          ref={inputRef}
          type="number"
          placeholder="Altra Cifra"
          inputMode="numeric"
          disabled={isSaving}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-2xl px-5 py-4 text-center text-xl text-[#D4AF37] placeholder:text-[#8E8E93]/30 focus:outline-none disabled:opacity-40 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="bg-white/10 border border-white/10 hover:bg-white/15 text-white hover:text-white font-semibold rounded-2xl px-6 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans text-xs whitespace-nowrap uppercase tracking-wider"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          Custom
        </button>
      </form>

      {/* Daily Transaction History */}
      <div className="mb-8 text-left">
        <div className="flex justify-between items-center mb-3 pl-1">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-semibold">
            Cronologia del Giorno
          </h3>
          {history.length > 0 && onUndoRecentTransaction && (
            <button
              type="button"
              onClick={() => setShowUndoConfirm(true)}
              className="text-[10px] uppercase tracking-wider text-red-500/90 hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer select-none transition-colors border border-red-500/20 hover:border-red-500/40 bg-red-900/10 hover:bg-red-900/20 px-2.5 py-1 rounded-xl active:scale-95 duration-150"
            >
              <RotateCcw className="w-3 h-3" />
              Annulla Ultimo
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl py-5 px-4 text-center text-xs text-[#8E8E93]/60 italic font-sans">
            Nessuna operazione registrata oggi
          </div>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {history.map((item, index) => {
              const itemTime = new Date(item.timestamp).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              const isRecent = index === 0;
              return (
                <div
                  key={item.id}
                  className={`bg-white/5 border rounded-2xl px-4 py-3 flex justify-between items-center transition-all ${
                    isRecent 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRecent && (
                      <span className="relative flex h-2 w-2 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">
                      {itemTime}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 font-sans">
                    +{item.amount}€
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back button only visible to Admin/Owner */}
      {isAdminMode ? (
        <button
          type="button"
          onClick={onExit}
          className="text-[#8E8E93] hover:text-gold-primary text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard Owner
        </button>
      ) : (
        <div className="text-[9px] uppercase tracking-[0.25em] text-red-500/60 font-medium font-sans">
          Sessione Protetta &bull; Usa "Blocca" in alto per uscire
        </div>
      )}

      {/* Custom Confirmation Modal for Undo */}
      <AnimatePresence>
        {showUndoConfirm && recentTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-stone-950 border border-red-500/30 p-6 rounded-2xl shadow-[0_10px_35px_rgba(239,68,68,0.15)] text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6 text-red-500 animate-pulse" />
              </div>

              <h3 className="font-serif text-lg font-bold text-stone-100 tracking-wide mb-2 uppercase">
                Annulla Operazione
              </h3>
              
              <p className="text-xs text-stone-400 font-sans leading-relaxed mb-6">
                Sei sicuro di voler eliminare l'ultima transazione di <strong className="text-red-400 font-semibold font-mono text-sm">+{recentTransaction.amount}€</strong> delle ore <span className="font-mono text-stone-200">{recentTransactionTime}</span>?<br />
                Il totale della sedia verrà ricalcolato.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUndoConfirm(false)}
                  disabled={isUndoing}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleUndoConfirm}
                  disabled={isUndoing}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUndoing ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    'Sì, Elimina'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
