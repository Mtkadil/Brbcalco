import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface ScreenAdminProps {
  totals: { [key: string]: number };
  histories?: { [key: string]: Array<{ id: string; amount: number; timestamp: string }> };
  onReset: () => Promise<void>;
  onBack: () => void;
}

export default function ScreenAdmin({ totals, histories = {}, onReset, onBack }: ScreenAdminProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedChairs, setExpandedChairs] = useState<{ [key: string]: boolean }>({});
  const [showLinks, setShowLinks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getFullLink = (query: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return query ? `${origin}${pathname}${query}` : `${origin}${pathname}`;
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {
      // safe fallback if iframe constraints block navigator.clipboard
      const tempInput = document.createElement('input');
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Compute Grand Total
  const t1 = totals.chair1 || 0;
  const t2 = totals.chair2 || 0;
  const t3 = totals.chair3 || 0;
  const t4 = totals.chair4 || 0;
  const grandTotal = t1 + t2 + t3 + t4;

  const handleReset = async () => {
    setIsResetting(true);
    await onReset();
    setIsResetting(false);
    setShowConfirm(false);
  };

  const percent = (val: number) => {
    if (grandTotal === 0) return 0;
    return Math.round((val / grandTotal) * 100);
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
        Global Overview
      </h2>
      <p className="font-serif text-2xl font-bold tracking-[2px] text-gold-primary uppercase mb-8 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-5 h-5 text-gold-primary stroke-[2]" />
        Dashboard
      </p>

      {/* List of chairs */}
      <div className="space-y-4 mb-6 text-left">
        {[1, 2, 3, 4].map((num) => {
          const key = `chair${num}`;
          const val = totals[key] || 0;
          const p = percent(val);
          return (
            <div key={num} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-serif text-sm text-stone-300 font-semibold">Sedia {num}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono ml-2">Station 0{num}</span>
                </div>
                <span className="font-bold text-stone-100 font-sans">
                  €<AnimatedCounter value={val} />
                </span>
              </div>
              
              {/* Contribution progress bar */}
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-gold-primary to-gold-light"
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-stone-500 font-mono mt-1 uppercase tracking-wider">
                <span>{p}% del salone</span>
                <button
                  type="button"
                  onClick={() => setExpandedChairs(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="text-gold-primary hover:text-white transition-colors cursor-pointer text-[9px] uppercase tracking-widest font-sans font-semibold"
                >
                  {expandedChairs[key] ? 'Nascondi Log ▲' : 'Mostra Log ▼'}
                </button>
              </div>

              {/* Collapsible history view */}
              <AnimatePresence>
                {expandedChairs[key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden mt-3 pt-3 border-t border-white/5"
                  >
                    <p className="text-[9px] uppercase tracking-widest text-[#8E8E93] mb-2 font-semibold font-sans">
                      Operazioni Odierne:
                    </p>
                    {(!histories[key] || histories[key].length === 0) ? (
                      <p className="text-[10px] text-stone-500 italic font-sans py-1">
                        Nessuna operazione registrata oggi.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {histories[key].map((item) => {
                          const itemTime = new Date(item.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });
                          return (
                            <div key={item.id} className="flex justify-between items-center bg-black/20 rounded-xl px-3 py-2 border border-white/5 text-[10px]">
                              <span className="font-mono text-[#8E8E93]">{itemTime}</span>
                              <span className="font-bold text-emerald-400 font-sans">
                                +{item.amount}€
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Isolated Device Links section for owner */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left">
          <button
            type="button"
            onClick={() => setShowLinks(!showLinks)}
            className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest text-[#8E8E93] font-semibold font-sans cursor-pointer focus:outline-none"
          >
            <span className="flex items-center gap-1.5">🔗 Collegamenti di Accesso Separati</span>
            <span className="text-gold-primary">{showLinks ? 'Nascondi ▲' : 'Mostra ▼'}</span>
          </button>

          <AnimatePresence>
            {showLinks && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden mt-4 space-y-4 pt-4 border-t border-white/5"
              >
                <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                  Condividi link differenti con i tuoi collaboratori e i tablet delle poltrone per isolare la sicurezza mantenendo la sincronizzazione attiva in tempo reale.
                </p>

                {/* Staff Selection Link */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-amber-500/80 font-bold block">
                    Portale Staff (Selezione Sedia)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getFullLink('')}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] text-stone-400 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy('staff', getFullLink(''))}
                      className="bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                    >
                      {copiedKey === 'staff' ? 'Copiato!' : 'Copia'}
                    </button>
                  </div>
                </div>

                {/* Individual Chairs Links */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-500/80 font-bold block">
                    Link Diretti Tablet (Postazione Singola)
                  </span>
                  {[1, 2, 3, 4].map((num) => {
                    const l = getFullLink(`?chair=${num}`);
                    const key = `chair_link_${num}`;
                    return (
                      <div key={num} className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-300 font-medium w-16 shrink-0">Sedia 0{num}:</span>
                        <input
                          type="text"
                          readOnly
                          value={l}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] text-stone-400 font-mono outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(key, l)}
                          className="bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                        >
                          {copiedKey === key ? 'Copiato!' : 'Copia'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Owner Admin Link */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold block">
                    Link Amministratore (Questo Pannello)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getFullLink('?role=owner')}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 bg-black/40 border border-red-500/20 rounded-xl px-3 py-1.5 text-[11px] text-stone-400 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy('owner', getFullLink('?role=owner'))}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                    >
                      {copiedKey === 'owner' ? 'Copiato!' : 'Copia'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grand Total section aligned with mockup styling */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mt-8 flex justify-between items-center shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#8E8E93] block mb-0.5">Total Revenue</span>
            <span className="text-3xl font-semibold font-serif text-gold-primary tracking-tight">
              €<AnimatedCounter value={grandTotal} />
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-[0.22em]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="text-[#8E8E93] hover:text-gold-primary text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer font-sans mt-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna alla Home
      </button>

      {/* Custom Confirmation Modal overlay (Avoids blocking window.confirm issues in iframe) */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-stone-950 border border-red-500/30 p-6 rounded-2xl shadow-[0_10px_35px_rgba(239,68,68,0.15)] text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>

              <h3 className="font-serif text-xl font-bold text-stone-100 mb-2">Conferma Reset</h3>
              <p className="text-sm text-stone-400 font-sans mb-6 leading-relaxed">
                Sei sicuro di voler azzerare tutti i dati di cassa per la giornata? Questa operazione cancellerà gli importi di tutte e 4 le sedie ed è irreversibile.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isResetting}
                  className="flex-1 bg-stone-900 hover:bg-stone-850 text-stone-300 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-stone-800 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 bg-red-650 hover:bg-red-600 disabled:bg-red-800 text-white py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isResetting ? 'Azzeramento...' : 'Sì, Azzera'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
