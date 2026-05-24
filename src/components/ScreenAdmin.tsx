import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { CHAIR_NAMES_MAP } from '../types';

interface ScreenAdminProps {
  totals: { [key: string]: number };
  histories?: { [key: string]: Array<{ id: string; amount: number; timestamp: string }> };
  onReset: () => Promise<void>;
  onBack: () => void;
  pinsData: {
    owner: string;
    chair1: string;
    chair2: string;
    chair3: string;
    chair4: string;
  };
  onUpdatePins: (newPins: {
    owner: string;
    chair1: string;
    chair2: string;
    chair3: string;
    chair4: string;
  }) => Promise<void>;
}

export default function ScreenAdmin({
  totals,
  histories = {},
  onReset,
  onBack,
  pinsData,
  onUpdatePins
}: ScreenAdminProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedChairs, setExpandedChairs] = useState<{ [key: string]: boolean }>({});
  const [showLinks, setShowLinks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Local state for PIN inputs
  const [localOwnerPin, setLocalOwnerPin] = useState(pinsData.owner);
  const [localChair1Pin, setLocalChair1Pin] = useState(pinsData.chair1);
  const [localChair2Pin, setLocalChair2Pin] = useState(pinsData.chair2);
  const [localChair3Pin, setLocalChair3Pin] = useState(pinsData.chair3);
  const [localChair4Pin, setLocalChair4Pin] = useState(pinsData.chair4);
  const [isSavingPins, setIsSavingPins] = useState(false);
  const [pinSaveSuccess, setPinSaveSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  // Keep local fields in-sync if remote database PINs are updated
  useEffect(() => {
    setLocalOwnerPin(pinsData.owner);
    setLocalChair1Pin(pinsData.chair1);
    setLocalChair2Pin(pinsData.chair2);
    setLocalChair3Pin(pinsData.chair3);
    setLocalChair4Pin(pinsData.chair4);
  }, [pinsData]);

  const handleSavePins = async () => {
    setPinError('');
    setPinSaveSuccess(false);

    // Validate lengths
    if (
      localOwnerPin.length !== 4 ||
      localChair1Pin.length !== 4 ||
      localChair2Pin.length !== 4 ||
      localChair3Pin.length !== 4 ||
      localChair4Pin.length !== 4
    ) {
      setPinError('Tutti i PIN devono essere composti da esattamente 4 cifre.');
      return;
    }

    // Validate they are only numbers
    const isNumeric = (val: string) => /^\d+$/.test(val);
    if (
      !isNumeric(localOwnerPin) ||
      !isNumeric(localChair1Pin) ||
      !isNumeric(localChair2Pin) ||
      !isNumeric(localChair3Pin) ||
      !isNumeric(localChair4Pin)
    ) {
      setPinError('I PIN devono contenere solo numeri (0-9).');
      return;
    }

    // Check for collisions/duplicates to avoid lockouts or ambiguous logins!
    const pinsSet = new Set([
      localOwnerPin,
      localChair1Pin,
      localChair2Pin,
      localChair3Pin,
      localChair4Pin
    ]);
    if (pinsSet.size < 5) {
      setPinError('Campi duplicati! Ogni postazione deve avere un PIN univoco per evitare che una spia l\'altra.');
      return;
    }

    setIsSavingPins(true);
    try {
      await onUpdatePins({
        owner: localOwnerPin,
        chair1: localChair1Pin,
        chair2: localChair2Pin,
        chair3: localChair3Pin,
        chair4: localChair4Pin,
      });
      setPinSaveSuccess(true);
      setTimeout(() => setPinSaveSuccess(false), 3000);
    } catch (err) {
      setPinError('Errore durante il salvataggio dei PIN.');
    } finally {
      setIsSavingPins(false);
    }
  };

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

  const handleExportCSV = () => {
    const todayStr = new Date().toLocaleDateString('it-IT');
    const todayTimeStr = new Date().toLocaleTimeString('it-IT');
    
    let csvContent = `BLOCK BARBER - Report Cassa\n`;
    csvContent += `Esportato il:;${todayStr} alle ${todayTimeStr}\n\n`;
    
    // Summary Section
    csvContent += `RIASSUNTO INCASSI\n`;
    csvContent += `Sedia;Barbiere;Incasso Totale (€)\n`;
    [1, 2, 3, 4].forEach((num) => {
      const key = `chair${num}`;
      const name = CHAIR_NAMES_MAP[num] || `Sedia ${num}`;
      const total = totals[key] || 0;
      csvContent += `Sedia 0${num};${name};${total}\n`;
    });
    csvContent += `TOTALE GENERALE;;${grandTotal}\n\n`;
    
    // Detailed Transactions Section
    csvContent += `DETTAGLIO TRANSAZIONI\n`;
    csvContent += `Timestamp;Sedia;Barbiere;Importo (€)\n`;
    
    let hasTransactions = false;
    [1, 2, 3, 4].forEach((num) => {
      const key = `chair${num}`;
      const name = CHAIR_NAMES_MAP[num] || `Sedia ${num}`;
      const list = histories[key] || [];
      if (list.length > 0) {
        hasTransactions = true;
        list.forEach((item) => {
          const itemTime = new Date(item.timestamp).toLocaleString('it-IT');
          csvContent += `"${itemTime}";Sedia 0${num};${name};${item.amount}\n`;
        });
      }
    });
    
    if (!hasTransactions) {
      csvContent += `Nessuna transazione registrata per la giornata.;;;\n`;
    }

    // Convert to Blob with UTF-8 BOM so Excel opens Italian characters perfectly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `BlockBarber_Cassa_${todayStr.replace(/\//g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  <span className="font-serif text-sm text-stone-300 font-semibold">{CHAIR_NAMES_MAP[num]}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono ml-2">Sedia 0{num}</span>
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
                        <span className="text-[10px] text-stone-300 font-medium w-20 shrink-0 text-left">{CHAIR_NAMES_MAP[num]}:</span>
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

        {/* Gestione PIN di Sicurezza */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#8E8E93] font-semibold font-sans mb-3 border-b border-white/5 pb-2">
            <span>⚙️ Impostazione Codici PIN</span>
            <span className="text-stone-500 font-mono text-[9px]">Protezione Cassa</span>
          </div>



          <div className="space-y-3 font-sans">
            {/* Owner PIN */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-stone-300 font-medium block">👑 Proprietario (Admin)</span>
                <span className="text-[9px] text-stone-500 font-mono">Accesso totale completo</span>
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={localOwnerPin}
                onChange={(e) => setLocalOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 bg-black/40 border border-white/10 text-center font-mono text-sm uppercase rounded-xl py-1 px-2 text-gold-primary tracking-[0.2em] outline-none focus:border-gold-primary"
              />
            </div>

            {/* Chair 1 PIN */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/5">
              <div>
                <span className="text-[11px] text-stone-300 font-medium block">💈 Sedia O1 &bull; Amine</span>
                <span className="text-[9px] text-stone-500 font-mono">Sedia 01</span>
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={localChair1Pin}
                onChange={(e) => setLocalChair1Pin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 bg-black/40 border border-white/10 text-center font-mono text-sm uppercase rounded-xl py-1 px-2 text-stone-200 tracking-[0.2em] outline-none focus:border-gold-primary"
              />
            </div>

            {/* Chair 2 PIN */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/5">
              <div>
                <span className="text-[11px] text-stone-300 font-medium block">💈 Sedia O2 &bull; Maher</span>
                <span className="text-[9px] text-stone-500 font-mono">Sedia 02</span>
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={localChair2Pin}
                onChange={(e) => setLocalChair2Pin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 bg-black/40 border border-white/10 text-center font-mono text-sm uppercase rounded-xl py-1 px-2 text-stone-200 tracking-[0.2em] outline-none focus:border-gold-primary"
              />
            </div>

            {/* Chair 3 PIN */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/5">
              <div>
                <span className="text-[11px] text-stone-300 font-medium block">💈 Sedia O3 &bull; Adil</span>
                <span className="text-[9px] text-stone-500 font-mono">Sedia 03</span>
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={localChair3Pin}
                onChange={(e) => setLocalChair3Pin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 bg-black/40 border border-white/10 text-center font-mono text-sm uppercase rounded-xl py-1 px-2 text-stone-200 tracking-[0.2em] outline-none focus:border-gold-primary"
              />
            </div>

            {/* Chair 4 PIN */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/5">
              <div>
                <span className="text-[11px] text-stone-300 font-medium block">💈 Sedia O4 &bull; Kevin</span>
                <span className="text-[9px] text-stone-500 font-mono">Sedia 04</span>
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={localChair4Pin}
                onChange={(e) => setLocalChair4Pin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-20 bg-black/40 border border-white/10 text-center font-mono text-sm uppercase rounded-xl py-1 px-2 text-stone-200 tracking-[0.2em] outline-none focus:border-gold-primary"
              />
            </div>
          </div>

          {/* Feedback & Save Actions */}
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
            {pinError && (
              <p className="text-[10px] text-red-400 font-sans flex items-center gap-1 font-semibold leading-normal">
                ⚠️ {pinError}
              </p>
            )}
            {pinSaveSuccess && (
              <p className="text-[10px] text-emerald-400 font-sans flex items-center gap-1 font-semibold leading-normal animate-pulse">
                ✓ I nuovi PIN sono stati salvati e applicati su Cloud Database!
              </p>
            )}
            <button
              type="button"
              onClick={handleSavePins}
              disabled={isSavingPins}
              className="w-full bg-gold-primary hover:bg-gold-light disabled:bg-gold-primary/30 text-black py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-95 duration-100 uppercase tracking-widest"
            >
              {isSavingPins ? 'Salvataggio...' : 'Salva PIN Modificati'}
            </button>
          </div>
        </div>

        {/* Grand Total section aligned with mockup styling */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mt-8 flex flex-col sm:flex-row gap-4 justify-between sm:items-center shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#8E8E93] block mb-0.5">Total Revenue</span>
            <span className="text-3xl font-semibold font-serif text-gold-primary tracking-tight">
              €<AnimatedCounter value={grandTotal} />
            </span>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/20 hover:border-gold-primary/40 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-[0.22em] flex-1 sm:flex-initial animate-fade-in"
            >
              <Download className="w-3.5 h-3.5" />
              Esporta CSV
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="border border-red-500/30 text-red-500/80 hover:text-white hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-[0.22em] flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
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
