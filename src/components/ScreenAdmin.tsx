import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Download, Lock, Eye, EyeOff } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { CHAIR_NAMES_MAP } from '../types';

interface ScreenAdminProps {
  totals: { [key: string]: number };
  histories?: { [key: string]: Array<{ id: string; amount: number; timestamp: string }> };
  onReset: () => Promise<void>;
  onBack: () => void;
  onPasswordsChange?: (passwords: { [key: string]: string }) => Promise<void>;
  currentPasswords?: { [key: string]: string };
}

export default function ScreenAdmin({ 
  totals, 
  histories = {}, 
  onReset, 
  onBack,
  onPasswordsChange,
  currentPasswords = {}
}: ScreenAdminProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedChairs, setExpandedChairs] = useState<{ [key: string]: boolean }>({});
  const [showLinks, setShowLinks] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Password management state
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);
  const [passwordInputs, setPasswordInputs] = useState({
    admin: currentPasswords.admin || 'admin123',
    chair1: currentPasswords.chair1 || 'pass1',
    chair2: currentPasswords.chair2 || 'pass2',
    chair3: currentPasswords.chair3 || 'pass3',
    chair4: currentPasswords.chair4 || 'pass4',
  });
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPasswords, setIsSavingPasswords] = useState(false);

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

  const handlePasswordInputChange = (key: string, value: string) => {
    setPasswordInputs(prev => ({
      ...prev,
      [key]: value
    }));
    setPasswordError('');
  };

  const handleSavePasswords = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    const passwordKeys = Object.keys(passwordInputs);
    for (const key of passwordKeys) {
      const pwd = passwordInputs[key as keyof typeof passwordInputs];
      if (!pwd || pwd.length < 3) {
        setPasswordError(`La password per ${key} deve essere almeno 3 caratteri.`);
        return;
      }
    }

    setIsSavingPasswords(true);
    try {
      if (onPasswordsChange) {
        await onPasswordsChange(passwordInputs);
      }
      setPasswordSuccess('Password aggiornate con successo!');
      setTimeout(() => {
        setPasswordSuccess('');
      }, 3000);
    } catch (error) {
      setPasswordError('Errore nel salvataggio delle password. Riprova.');
      console.error(error);
    } finally {
      setIsSavingPasswords(false);
    }
  };

  const handleExportCSV = () => {
    const todayStr = new Date().toLocaleDateString('it-IT');
    const todayTimeStr = new Date().toLocaleTimeString('it-IT');
    
    let csvContent = `BLOCK BARBER - Report Cassa\n`;
    csvContent += `Esportato il:;${todayStr} alle ${todayTimeStr}\n\n`;
    
    csvContent += `RIASSUNTO INCASSI\n`;
    csvContent += `Sedia;Barbiere;Incasso Totale (€)\n`;
    [1, 2, 3, 4].forEach((num) => {
      const key = `chair${num}`;
      const name = CHAIR_NAMES_MAP[num] || `Sedia ${num}`;
      const total = totals[key] || 0;
      csvContent += `Sedia 0${num};${name};${total}\n`;
    });
    csvContent += `TOTALE GENERALE;;${grandTotal}\n\n`;
    
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

        {/* PASSWORD SETTINGS SECTION */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left">
          <button
            type="button"
            onClick={() => setShowPasswordSettings(!showPasswordSettings)}
            className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest text-[#8E8E93] font-semibold font-sans cursor-pointer focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Gestione Password
            </span>
            <span className="text-gold-primary">{showPasswordSettings ? 'Nascondi ▲' : 'Mostra ▼'}</span>
          </button>

          <AnimatePresence>
            {showPasswordSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden mt-4 space-y-4 pt-4 border-t border-white/5"
              >
                {/* Error Message */}
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-[11px]">
                    {passwordError}
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-[11px]">
                    ✓ {passwordSuccess}
                  </div>
                )}

                <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                  Modifica le password di accesso per il pannello admin e per ogni postazione. Le password devono essere almeno 3 caratteri.
                </p>

                {/* Admin Password */}
                <div className="space-y-2 pb-3 border-b border-white/5">
                  <label className="text-[9px] uppercase tracking-wider text-red-400/80 font-bold block">
                    🔐 Password Amministratore
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPasswords.admin ? 'text' : 'password'}
                        value={passwordInputs.admin}
                        onChange={(e) => handlePasswordInputChange('admin', e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-stone-500 focus:border-gold-primary/50 focus:ring-1 focus:ring-gold-primary/30 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, admin: !prev.admin }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition-colors"
                      >
                        {showPasswords.admin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chair Passwords */}
                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-bold block">
                    Password Postazioni
                  </label>
                  {[1, 2, 3, 4].map((num) => {
                    const key = `chair${num}`;
                    const chairKey = `chair${num}` as keyof typeof passwordInputs;
                    return (
                      <div key={num} className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-300 font-medium w-24 shrink-0 text-left">
                          {CHAIR_NAMES_MAP[num]}:
                        </span>
                        <div className="flex-1 relative">
                          <input
                            type={showPasswords[key] ? 'text' : 'password'}
                            value={passwordInputs[chairKey]}
                            onChange={(e) => handlePasswordInputChange(key, e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-stone-500 focus:border-gold-primary/50 focus:ring-1 focus:ring-gold-primary/30 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition-colors"
                          >
                            {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSavePasswords}
                  disabled={isSavingPasswords}
                  className="w-full bg-gold-primary hover:bg-gold-primary/90 disabled:bg-gold-primary/50 text-black font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-4"
                >
                  {isSavingPasswords ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Salva Password
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
              className="bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/20 hover:border-gold-primary/40 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Esporta CSV
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="border border-red-500/30 text-red-500/80 hover:text-white hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-xs font-semibold"
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
        Logout
      </button>

      {/* Custom Confirmation Modal overlay */}
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
