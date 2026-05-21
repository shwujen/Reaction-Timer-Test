import { ReactionAttempt, GameStats } from '../types';
import { Award, Zap, History, Trash2, TrendingUp, AlertCircle, Sparkles, Sliders, Timer, Eye, Radio, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StatsDashboardProps {
  stats: GameStats;
  onClearStats: () => void;
}

export default function StatsDashboard({ stats, onClearStats }: StatsDashboardProps) {
  const successAttempts = stats.attempts.filter((a) => a.state === 'SUCCESS');
  // Record the last 10 test attempts (as requested)
  const recentAttempts = [...successAttempts].slice(-10);

  // Calculate averages per mode
  const avgVisual =
    successAttempts.filter((a) => a.mode === 'VISUAL').length > 0
      ? Math.round(
          successAttempts
            .filter((a) => a.mode === 'VISUAL')
            .reduce((acc, curr) => acc + curr.time, 0) /
            successAttempts.filter((a) => a.mode === 'VISUAL').length
        )
      : null;

  const avgAudio =
    successAttempts.filter((a) => a.mode === 'AUDIO').length > 0
      ? Math.round(
          successAttempts
            .filter((a) => a.mode === 'AUDIO')
            .reduce((acc, curr) => acc + curr.time, 0) /
            successAttempts.filter((a) => a.mode === 'AUDIO').length
        )
      : null;

  const avgColor =
    successAttempts.filter((a) => a.mode === 'COLOR').length > 0
      ? Math.round(
          successAttempts
            .filter((a) => a.mode === 'COLOR')
            .reduce((acc, curr) => acc + curr.time, 0) /
            successAttempts.filter((a) => a.mode === 'COLOR').length
        )
      : null;

  // Calculate OVERALL average reaction speed
  const overallAvg = successAttempts.length > 0
    ? Math.round(successAttempts.reduce((acc, curr) => acc + curr.time, 0) / successAttempts.length)
    : null;

  // Calculate OVERALL fastest (最快) and slowest (最慢) reaction times (as requested!)
  const overallFastest = successAttempts.length > 0
    ? Math.min(...successAttempts.map(a => a.time))
    : null;

  const overallSlowest = successAttempts.length > 0
    ? Math.max(...successAttempts.map(a => a.time))
    : null;

  // Best of modes
  const bestVisualValue = stats.bestVisual;
  const bestAudioValue = stats.bestAudio;
  const bestColorValue = stats.bestColor;

  // Determine overall rank based on average
  const getRank = (ms: number) => {
    if (ms < 160) return { title: '⚡️ 雷神 (Godlike)', desc: '超越電競選手的神之反應！', color: 'text-violet-600 bg-violet-50 border-violet-100' };
    if (ms < 210) return { title: '🐆 獵豹 (Cheetah)', desc: '快如獵豹，反射神經極佳！', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (ms < 270) return { title: '🐇 兔子 (Rabbit)', desc: '敏捷靈巧，水準之上的速度。', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (ms < 380) return { title: '🚶 人類 (Human)', desc: '標準普通人的反應時間。', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    return { title: '🐢 樹懶 (Sloth)', desc: '稍微有點慢喔，打起精神來！', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  // Sparkline line points for up to last 10 attempts
  const getSparklinePoints = () => {
    if (recentAttempts.length < 2) return '';
    const width = 300;
    const height = 50;
    const times = recentAttempts.map((a) => a.time);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const range = max - min || 1;

    return recentAttempts
      .map((attempt, index) => {
        const x = (index / (recentAttempts.length - 1)) * width;
        const normalizedY = (attempt.time - min) / range;
        const y = height - normalizedY * (height * 0.7) - height * 0.15; // padding
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* 1. Statistics Cards Overview Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* BEST VISUAL */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block tracking-wide">視覺最佳 / 平均</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-amber-600">
                {bestVisualValue ? bestVisualValue : '--'}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm font-bold font-mono text-slate-500">
                {avgVisual ? `${avgVisual}ms` : '--'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-500">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* BEST AUDIO */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block tracking-wide">聽覺最佳 / 平均</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-purple-600">
                {bestAudioValue ? bestAudioValue : '--'}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm font-bold font-mono text-slate-500">
                {avgAudio ? `${avgAudio}ms` : '--'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-600">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* BEST COLOR */}
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block tracking-wide">顏色最佳 / 平均</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-600">
                {bestColorValue ? bestColorValue : '--'}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm font-bold font-mono text-slate-500">
                {avgColor ? `${avgColor}ms` : '--'}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-500">
            <Palette className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL SESSIONS SUMMARY */}
        <div className="bg-indigo-950/5 p-4 rounded-xl border border-indigo-200/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 block tracking-wide">測試次數 / 成功</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-indigo-900">
                {stats.attempts.length}
              </span>
              <span className="text-xs text-indigo-500 font-medium">次 / </span>
              <span className="text-sm font-bold text-emerald-600 font-mono">
                {successAttempts.length}
              </span>
              <span className="text-xs text-slate-400">成功</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Timer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Global Fastest / Slowest and overall averages */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3.5 px-4 justify-center sm:justify-start">
          <div className="p-3 rounded-full bg-orange-500/10 text-orange-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">千分之一秒極速 (最快反應)</span>
            <span className="text-2xl font-black font-mono text-slate-800">
              {overallFastest ? `${overallFastest} ms` : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 px-4 pt-3 sm:pt-0 justify-center sm:justify-start">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-600">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">最高生理遲緩 (最慢反應)</span>
            <span className="text-2xl font-black font-mono text-slate-800">
              {overallSlowest ? `${overallSlowest} ms` : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 px-4 pt-3 sm:pt-0 justify-center sm:justify-start">
          <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-600">
            <Sliders className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">不分類全效期平均反應</span>
            <span className="text-2xl font-black font-mono text-indigo-600">
              {overallAvg ? `${overallAvg} ms` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Graph and Custom Table Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sparkline Reaction Trend Panel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500 animate-pulse" />
                <h3 className="font-extrabold text-slate-800 text-sm">手速波形趨勢曲線 (最近 10 次成功紀錄)</h3>
              </div>
              {recentAttempts.length >= 2 && (
                <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" /> 10-Taps Log
                </span>
              )}
            </div>

            {recentAttempts.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <AlertCircle className="w-8 h-8 opacity-50 mb-2 text-indigo-300" />
                <p className="text-xs">請至少完成兩次成功測試，即能在高精度儀表板中繪製折線圖。</p>
              </div>
            ) : (
              <div className="w-full flex flex-col justify-center py-2">
                <div className="relative w-full h-[85px]">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 50" preserveAspectRatio="none">
                    {/* Horizontal threshold reference line */}
                    <line x1="0" y1="25" x2="300" y2="25" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                    
                    {/* Animated Trend Line */}
                    <motion.polyline
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSparklinePoints()}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                    />
                    
                    {/* SVG Points representing standard values */}
                    {recentAttempts.map((attempt, index) => {
                      const width = 300;
                      const height = 50;
                      const times = recentAttempts.map((a) => a.time);
                      const min = Math.min(...times);
                      const max = Math.max(...times);
                      const range = max - min || 1;
                      const x = (index / (recentAttempts.length - 1)) * width;
                      const normalizedY = (attempt.time - min) / range;
                      const y = height - normalizedY * (height * 0.7) - height * 0.15;

                      return (
                        <g key={attempt.id} className="group cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            className={`stroke-white stroke-2 hover:r-7 transition-all duration-150 ${
                              attempt.mode === 'VISUAL'
                                ? 'fill-amber-500'
                                : attempt.mode === 'AUDIO'
                                ? 'fill-purple-500'
                                : 'fill-emerald-500'
                            }`}
                          />
                          <title>{`${
                            attempt.mode === 'VISUAL' ? '視覺' : attempt.mode === 'AUDIO' ? '聽覺' : '顏色'
                          }: ${attempt.time}ms`}</title>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend and graph footer metadata */}
                <div className="flex justify-between items-center mt-3 text-[10px] text-gray-400 font-mono">
                  <span>十回溯 - 較舊(左) → 最新(右)</span>
                  <div className="flex gap-2.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> 視覺
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span> 聽覺
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 顏色
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-150 mt-4 pt-3 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              單回測試犯規率：
              <span className="font-bold text-rose-500 font-mono">
                {stats.attempts.length > 0
                  ? Math.round(
                      (stats.attempts.filter((a) => a.state === 'TOO_EARLY' || a.state === 'INCORRECT_KEY').length /
                        stats.attempts.length) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>

            {stats.attempts.length > 0 && (
              <button
                onClick={onClearStats}
                className="text-xs text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100"
                id="btn-clear-stats"
              >
                <Trash2 className="w-3.5 h-3.5" /> 清空測試庫
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Attempt logs list (Recent 10 list details) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">反應日誌 (Recent 10)</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                歷史倒序
              </span>
            </div>

            <div className="space-y-2 max-h-[225px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {stats.attempts.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400">目前尚無測試紀錄</div>
                ) : (
                  [...stats.attempts]
                    .reverse()
                    .slice(0, 10) // Display the last 10 attempts! (As requested)
                    .map((attempt) => {
                      const rank = getRank(attempt.time);
                      const isFoul = attempt.state === 'TOO_EARLY';
                      const isWrongKey = attempt.state === 'INCORRECT_KEY';
                      
                      return (
                        <motion.div
                          key={attempt.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className={`flex items-center justify-between p-2 rounded-xl text-[11px] border ${
                            isFoul || isWrongKey
                              ? 'bg-rose-50/50 border-rose-100'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${
                                attempt.mode === 'VISUAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : attempt.mode === 'AUDIO'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {attempt.mode === 'VISUAL' ? '視覺' : attempt.mode === 'AUDIO' ? '聽覺' : '顏色'}
                            </span>
                            <span className="text-gray-400 text-[10px] font-mono">
                              {new Date(attempt.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          {isFoul ? (
                            <span className="font-bold text-rose-500 text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-mono">
                              搶拍犯規
                            </span>
                          ) : isWrongKey ? (
                            <span className="font-bold text-rose-500 text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-mono" title={`按下: ${attempt.pressedKey?.toUpperCase()}`}>
                              拼錯色鍵 ({attempt.pressedKey?.toUpperCase()})
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-700 font-mono text-xs">{attempt.time} ms</span>
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${rank.color}`}
                                title={rank.desc}
                              >
                                {rank.title.split(' ')[1]}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-gray-400 bg-slate-50 p-2 rounded-xl border border-slate-100">
            📊 測試結果為本地即時記錄，多次測試能校正隨機變因，獲得最科學的全身神經元反應延遲。
          </div>
        </div>
      </div>
    </div>
  );
}
