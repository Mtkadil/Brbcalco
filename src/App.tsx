import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { OperationType, ScreenType } from './types';

// Screens
import ScreenHome from './components/ScreenHome';
import ScreenSelection from './components/ScreenSelection';
import ScreenChair from './components/ScreenChair';
import ScreenAdmin from './components/ScreenAdmin';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home-screen');
  const [selectedChair, setSelectedChair] = useState<number | null>(null);
  
  const [chairsData, setChairsData] = useState<{
    [key: string]: {
      total: number;
      history: Array<{ id: string; amount: number; timestamp: string }>;
    };
  }>({
    chair1: { total: 0, history: [] },
    chair2: { total: 0, history: [] },
    chair3: { total: 0, history: [] },
    chair4: { total: 0, history: [] },
  });

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial document check & connection boot
  useEffect(() => {
    async function initDatabaseDocs() {
      const chairKeys = ['chair1', 'chair2', 'chair3', 'chair4'];
      for (const id of chairKeys) {
        try {
          const chairRef = doc(db, 'chairs', id);
          const docSnap = await getDoc(chairRef);
          if (!docSnap.exists()) {
            // Initialize document immediately with default keys if missing
            await setDoc(chairRef, { total: 0, history: [] });
          }
        } catch (error) {
          console.warn(`Initial check for ${id} returned:`, error);
        }
      }
      setIsLoading(false);
    }
    initDatabaseDocs();
  }, []);

  // 2. Setup real-time subscribers for both security and live data synchronization
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    const chairKeys = ['chair1', 'chair2', 'chair3', 'chair4'];

    chairKeys.forEach((key) => {
      const pathStr = `chairs/${key}`;
      const unsub = onSnapshot(
        doc(db, 'chairs', key),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setChairsData((prev) => ({
              ...prev,
              [key]: {
                total: typeof data?.total === 'number' ? data.total : 0,
                history: Array.isArray(data?.history) ? data.history : [],
              },
            }));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, pathStr);
        }
      );
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  // 3. Process URL Query specifications (?chair=X) & Roles (?role=owner)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chairParam = params.get('chair');
    const roleParam = params.get('role');
    const modeParam = params.get('mode');
    
    const isOwner = roleParam === 'owner' || modeParam === 'admin';
    setIsAdminMode(isOwner);

    if (isOwner) {
      setCurrentScreen('admin-dashboard');
    } else if (chairParam && ['1', '2', '3', '4'].includes(chairParam)) {
      const num = parseInt(chairParam, 10);
      setSelectedChair(num);
      setCurrentScreen('chair-screen');
    } else {
      // Operators / barbiere are routed directly to selection-screen to completely isolate landing from owner choices
      setCurrentScreen('selection-screen');
    }
  }, []);

  // Navigation controller with browser state sync
  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    if (screen === 'home-screen') {
      setSelectedChair(null);
      if (isAdminMode) {
        window.history.pushState({}, '', '?role=owner');
      } else {
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  };

  const handleSelectChair = (num: number) => {
    setSelectedChair(num);
    setCurrentScreen('chair-screen');
    // Maintain direct chair path so bookmarking works
    window.history.pushState({}, '', `?chair=${num}`);
  };

  const handleAddAmount = async (amount: number) => {
    if (!selectedChair) return;
    const chairKey = `chair${selectedChair}`;
    const currentObj = chairsData[chairKey] || { total: 0, history: [] };
    const newTotal = currentObj.total + amount;

    const newHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [newHistoryItem, ...(currentObj.history || [])].slice(0, 500);

    try {
      const chairRef = doc(db, 'chairs', chairKey);
      await updateDoc(chairRef, {
        total: newTotal,
        updatedAt: serverTimestamp(),
        history: newHistory,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chairs/${chairKey}`);
    }
  };

  const handleUndoRecentTransaction = async () => {
    if (!selectedChair) return;
    const chairKey = `chair${selectedChair}`;
    const currentObj = chairsData[chairKey] || { total: 0, history: [] };
    const historyList = currentObj.history || [];
    if (historyList.length === 0) return;

    const [recentItem, ...remainingHistory] = historyList;
    const newTotal = Math.max(0, currentObj.total - recentItem.amount);

    try {
      const chairRef = doc(db, 'chairs', chairKey);
      await updateDoc(chairRef, {
        total: newTotal,
        updatedAt: serverTimestamp(),
        history: remainingHistory,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chairs/${chairKey}`);
    }
  };

  const handleResetDailyData = async () => {
    for (let i = 1; i <= 4; i++) {
      const chairKey = `chair${i}`;
      try {
        const chairRef = doc(db, 'chairs', chairKey);
        await updateDoc(chairRef, {
          total: 0,
          updatedAt: serverTimestamp(),
          history: [],
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `chairs/${chairKey}`);
      }
    }
  };

  const formattedHeaderDate = new Date().toLocaleDateString('it-IT', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-full border-t-2 border-gold-primary animate-spin mb-4" />
        <p className="font-serif tracking-wider text-stone-400 text-sm uppercase">Caricamento Salone...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] font-sans flex flex-col p-4 md:p-8 overflow-x-hidden relative selection:bg-gold-primary selection:text-black">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main layout wrapper */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between py-4 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase mb-1 font-sans text-gold-primary">
              MoMo BloCk BARber
            </h1>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#8E8E93]">
              Luxury Cash Live &bull; Management App
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2.5 flex-1 sm:flex-initial">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[9px] uppercase tracking-widest text-[#8E8E93] font-semibold">Live Sync Active</span>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center flex-1 sm:flex-initial">
              <span className="text-[9px] uppercase tracking-widest text-[#8E8E93] block">Today</span>
              <p className="font-semibold text-xs tracking-wider">{formattedHeaderDate}</p>
            </div>
          </div>
        </header>

        {/* Primary Container card styling with custom boundaries */}
        <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.6)] min-h-[460px] flex flex-col justify-center my-auto">
          <AnimatePresence mode="wait">
            {currentScreen === 'home-screen' && (
              <div key="home" className="w-full">
                <ScreenHome
                  onNavigate={(screen) => handleNavigate(screen)}
                />
              </div>
            )}

            {currentScreen === 'selection-screen' && (
              <div key="selection" className="w-full">
                <ScreenSelection
                  onSelectChair={handleSelectChair}
                  isAdminMode={isAdminMode}
                  onBack={() => handleNavigate('home-screen')}
                />
              </div>
            )}

            {currentScreen === 'chair-screen' && selectedChair !== null && (
              <div key="chair" className="w-full">
                <ScreenChair
                  chairNum={selectedChair}
                  total={chairsData[`chair${selectedChair}`]?.total || 0}
                  history={chairsData[`chair${selectedChair}`]?.history || []}
                  onAddAmount={handleAddAmount}
                  onUndoRecentTransaction={handleUndoRecentTransaction}
                  onExit={() => {
                    if (isAdminMode) {
                      handleNavigate('admin-dashboard');
                    } else {
                      setSelectedChair(null);
                      setCurrentScreen('selection-screen');
                      window.history.pushState({}, '', window.location.pathname);
                    }
                  }}
                />
              </div>
            )}

            {currentScreen === 'admin-dashboard' && (
              <div key="admin" className="w-full">
                <ScreenAdmin
                  totals={Object.keys(chairsData).reduce((acc, key) => {
                    acc[key] = chairsData[key].total;
                    return acc;
                  }, {} as { [key: string]: number })}
                  histories={Object.keys(chairsData).reduce((acc, key) => {
                    acc[key] = chairsData[key].history;
                    return acc;
                  }, {} as { [key: string]: Array<{ id: string; amount: number; timestamp: string }> })}
                  onReset={handleResetDailyData}
                  onBack={() => handleNavigate('home-screen')}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Status Bar */}
        <footer className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#8E8E93] border-t border-white/5 pt-6 mt-8">
          <div>Firmware: v2.4.0-lux</div>
          <div className="flex gap-4">
            <span>Device ID: MOMO_BLOCK_BARBER_01_X</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Encrypted Node Connection</span>
          </div>
          <div className="text-[#D4AF37] font-semibold">Authenticated: Proprietario</div>
        </footer>
      </div>
    </div>
  );
}
