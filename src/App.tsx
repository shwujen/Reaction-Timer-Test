import { useState, useEffect } from 'react';
import { ReactionAttempt, GameStats } from './types';
import GameArea from './components/GameArea';
import StatsDashboard from './components/StatsDashboard';
import { Timer, RefreshCw, Zap, Award, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

const STORAGE_KEY = 'reaction_game_stats_v1';

const getInitialStats = (): GameStats => {
  if (typeof window === 'undefined') {
    return { bestVisual: null, bestAudio: null, bestColor: null, attempts: [] };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        bestVisual: parsed.bestVisual ?? null,
        bestAudio: parsed.bestAudio ?? null,
        bestColor: parsed.bestColor ?? null,
        attempts: parsed.attempts ?? [],
      };
    }
  } catch (e) {
    console.error('Failed to parse saved reaction stats', e);
  }
  return { bestVisual: null, bestAudio: null, bestColor: null, attempts: [] };
};

export default function App() {
  const [stats, setStats] = useState<GameStats>(() => getInitialStats());

  // Save progress changes to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save reaction stats', e);
    }
  }, [stats]);

  const handleAttemptComplete = (newAttempt: ReactionAttempt) => {
    setStats((prev) => {
      const updatedAttempts = [...prev.attempts, newAttempt];
      
      // Calculate new bests for successful clicks
      let newBestVisual = prev.bestVisual;
      let newBestAudio = prev.bestAudio;
      let newBestColor = prev.bestColor;

      if (newAttempt.state === 'SUCCESS') {
        if (newAttempt.mode === 'VISUAL') {
          newBestVisual = prev.bestVisual === null 
            ? newAttempt.time 
            : Math.min(prev.bestVisual, newAttempt.time);
        } else if (newAttempt.mode === 'AUDIO') {
          newBestAudio = prev.bestAudio === null 
            ? newAttempt.time 
            : Math.min(prev.bestAudio, newAttempt.time);
        } else if (newAttempt.mode === 'COLOR') {
          newBestColor = prev.bestColor === null 
            ? newAttempt.time 
            : Math.min(prev.bestColor, newAttempt.time);
        }
      }

      return {
        bestVisual: newBestVisual,
        bestAudio: newBestAudio,
        bestColor: newBestColor,
        attempts: updatedAttempts,
      };
    });
  };

  const handleClearStats = () => {
    if (window.confirm('確定要清除所有歷史測試紀錄嗎？這項操作無法復原。')) {
      const cleared = { bestVisual: null, bestAudio: null, bestColor: null, attempts: [] };
      setStats(cleared);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-50 via-slate-50 to-stone-50 text-slate-800 flex flex-col selection:bg-indigo-150 selection:text-indigo-900 pb-16">
      {/* Navbar / Header area */}
      <header className="border-b border-slate-150 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-800">反應力測試儀</h1>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide block leading-none mt-0.5">
                SPEED & AUDITORY REFLEX TEST
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-150 px-3 py-1.5 rounded-full border border-slate-200 transition-colors pointer-events-none text-slate-700 font-semibold text-[11px] font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            反應力極限挑戰
          </div>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="w-full max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col gap-8">
        
        {/* Title / Description Splash section */}
        <section className="text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Vite + Web Audio Synthesizer
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1">
              精準反應力與反射神經測試
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              點擊主色區或敲擊空白鍵開始！測試信號一亮起或一發出嗶聲，即在千分之一秒內做出反應。反複測試以記錄您的平均數值，建立趨勢曲線圖。
            </p>
          </div>

          <div className="flex gap-2 text-center sm:text-left min-w-[280px] bg-slate-50 p-3 rounded-2xl border border-slate-100 justify-around">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">視覺最佳</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-700">
                {stats.bestVisual ? `${stats.bestVisual} ms` : '--'}
              </span>
            </div>
            <div className="w-px bg-slate-200 self-stretch my-1" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">聽覺最佳</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-700">
                {stats.bestAudio ? `${stats.bestAudio} ms` : '--'}
              </span>
            </div>
            <div className="w-px bg-slate-200 self-stretch my-1" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">顏色最佳</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-700">
                {stats.bestColor ? `${stats.bestColor} ms` : '--'}
              </span>
            </div>
          </div>
        </section>

        {/* Core Game UI Canvas Area */}
        <section className="w-full">
          <GameArea
            onAttemptComplete={handleAttemptComplete}
            bestVisual={stats.bestVisual}
            bestAudio={stats.bestAudio}
            bestColor={stats.bestColor}
          />
        </section>

        {/* Stats Dashboard Grid */}
        <section className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-bold tracking-tight text-slate-700 uppercase">
              科學化數據解析
            </span>
          </div>
          <StatsDashboard stats={stats} onClearStats={handleClearStats} />
        </section>

        {/* Methodology Instructions / FAQ */}
        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 text-sm">反應力科學知識與指引</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-xs">🔍 人類的平均反應力是多少？</h4>
              <p>
                一般智人的平均視覺反應時間約為 <span className="font-bold">200 ~ 250 毫秒 (ms)</span>。
                聽覺反應通常稍快一些，約為 <span className="font-bold">150 ~ 170 毫秒</span>，因為聽覺信號傳遞至大腦皮質的突觸層次較視覺更少。
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-xs">💪 如何優化硬體以達到極限？</h4>
              <p>
                反應容易受到硬體設備的影響。使用高螢幕更新率（如 144Hz 或 240Hz）能使畫面變色更加迅速；使用有線滑鼠或鍵盤，也能大幅減少無線傳輸延遲！
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 text-xs">🍎 影響日常反射的生理因子</h4>
              <p>
                充足的睡眠、攝取適當的咖啡因、主動式呼吸法皆能短暫幫助神經中樞維持在高張興奮狀態。如果您的成績低於正常值，試著放空呼吸，調整神經節律再試試！
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-4xl mx-auto px-4 mt-auto text-center text-xs text-gray-400">
        <p>© 2026 反應力精準度測試儀. All rights reserved. 採用極致純淨的 Web Audio 與 CSS3 技術構規。</p>
      </footer>
    </div>
  );
}
