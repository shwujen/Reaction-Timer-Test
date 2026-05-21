import { useState, useEffect, useRef } from 'react';
import { GameState, GameMode, ReactionAttempt } from '../types';
import { playSuccessSound, playFailSound, playTriggerBeep, playClickBeep } from '../utils/audio';
import { Zap, Volume2, VolumeX, Keyboard, RefreshCw, AlertCircle, PlayCircle, Eye, Radio, Palette, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameAreaProps {
  onAttemptComplete: (attempt: ReactionAttempt) => void;
  bestVisual: number | null;
  bestAudio: number | null;
  bestColor: number | null;
}

interface ColorOption {
  name: string;
  key: string;      // keyboard code: e.g. "KeyR"
  char: string;     // uppercase char: "R"
  hex: string;      // hex color Code
  tailwindBgClass: string; // for bubble bg
  btnColor: string; // button borders & rings
  hoverClass: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { 
    name: '紅色 (RED)', 
    key: 'KeyR', 
    char: 'R', 
    hex: '#ef4444', 
    tailwindBgClass: 'bg-red-500 border-red-650 text-white shadow-lg shadow-red-500/30', 
    btnColor: 'bg-red-600 hover:bg-red-700 text-white ring-red-400/40',
    hoverClass: 'hover:bg-red-50 hover:text-red-600 border-red-200'
  },
  { 
    name: '綠色 (GREEN)', 
    key: 'KeyG', 
    char: 'G', 
    hex: '#22c55e', 
    tailwindBgClass: 'bg-emerald-500 border-emerald-650 text-slate-950 shadow-lg shadow-emerald-500/30', 
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-slate-950 ring-emerald-400/40',
    hoverClass: 'hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200'
  },
  { 
    name: '藍色 (BLUE)', 
    key: 'KeyB', 
    char: 'B', 
    hex: '#3b82f6', 
    tailwindBgClass: 'bg-blue-500 border-blue-650 text-white shadow-lg shadow-blue-500/30', 
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white ring-blue-400/40',
    hoverClass: 'hover:bg-blue-50 hover:text-blue-600 border-blue-200'
  },
];

export default function GameArea({ onAttemptComplete, bestVisual, bestAudio, bestColor }: GameAreaProps) {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [mode, setMode] = useState<GameMode>('VISUAL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  
  // Specific for choice color mode
  const [activeColorOption, setActiveColorOption] = useState<ColorOption | null>(null);
  const [wrongKeyPressed, setWrongKeyPressed] = useState<string>('');

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sound triggering dispatcher
  const triggerSound = (type: 'CLICK' | 'SUCCESS' | 'FAIL' | 'TRIGGER') => {
    if (!soundEnabled) return;
    if (type === 'CLICK') playClickBeep();
    if (type === 'SUCCESS') playSuccessSound();
    if (type === 'FAIL') playFailSound();
    if (type === 'TRIGGER') playTriggerBeep();
  };

  // Main start controller
  const handleStart = () => {
    if (gameState === 'IDLE' || gameState === 'RESULT' || gameState === 'TOO_EARLY' || gameState === 'INCORRECT_KEY') {
      triggerSound('CLICK');
      setGameState('WAITING');
      setReactionTime(null);
      setActiveColorOption(null);
      setWrongKeyPressed('');

      // Random wait interval (1.0 to 3.5 seconds)
      const randomWait = Math.random() * 2500 + 1000;
      
      timeoutRef.current = setTimeout(() => {
        startTimeRef.current = performance.now();
        
        if (mode === 'COLOR') {
          // Select a random color option to test reaction discrimination
          const randomOpt = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
          setActiveColorOption(randomOpt);
          setGameState('NOW');
          triggerSound('TRIGGER');
        } else {
          setGameState('NOW');
          if (mode === 'AUDIO') {
            triggerSound('TRIGGER');
          }
        }
      }, randomWait);
    }
  };

  // Visual & Sound space clicking action
  const handleAction = () => {
    // We only process clicking on the main region if it's NOT the multi-color selector choice
    if (mode === 'COLOR' && gameState === 'NOW') {
      // In color selection mode, user is expected to click specific choice buttons, not the raw arena background.
      // Warn them or do nothing so we don't count it as a cheat or failure.
      return;
    }

    if (gameState === 'WAITING') {
      // Too early!
      handleTooEarlyFoul();
    } else if (gameState === 'NOW') {
      // Success triggers!
      handleSuccess();
    } else {
      // Restart
      handleStart();
    }
  };

  // Specific Success state mapper
  const handleSuccess = () => {
    const endTime = performance.now();
    const elapsed = Math.round(endTime - startTimeRef.current);
    setReactionTime(elapsed);
    triggerSound('SUCCESS');
    setGameState('RESULT');

    const attempt: ReactionAttempt = {
      id: Math.random().toString(36).substring(2, 11),
      time: elapsed,
      timestamp: Date.now(),
      mode,
      state: 'SUCCESS',
    };
    onAttemptComplete(attempt);
  };

  // Specific too early foul mapper
  const handleTooEarlyFoul = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    triggerSound('FAIL');
    setGameState('TOO_EARLY');

    const attempt: ReactionAttempt = {
      id: Math.random().toString(36).substring(2, 11),
      time: 0,
      timestamp: Date.now(),
      mode,
      state: 'TOO_EARLY',
    };
    onAttemptComplete(attempt);
  };

  // Custom choice button action (for mobile touch compatibility and direct clicks)
  const handleColorChoiceClick = (selectedOption: ColorOption, event?: { stopPropagation: () => void }) => {
    if (event) {
      event.stopPropagation(); // Avoid triggering parent background click
    }

    if (gameState !== 'NOW' || !activeColorOption) return;

    if (selectedOption.char === activeColorOption.char) {
      // Correct color chosen! Score points!
      handleSuccess();
    } else {
      // Incorrect choice trigger!
      handleWrongColorChoice(selectedOption.char);
    }
  };

  // Handle wrong button selection
  const handleWrongColorChoice = (charPressed: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setWrongKeyPressed(charPressed);
    triggerSound('FAIL');
    setGameState('INCORRECT_KEY');

    const attempt: ReactionAttempt = {
      id: Math.random().toString(36).substring(2, 11),
      time: 0,
      timestamp: Date.now(),
      mode,
      state: 'INCORRECT_KEY',
      targetColorName: activeColorOption?.name,
      pressedKey: charPressed,
    };
    onAttemptComplete(attempt);
  };

  const handleReset = () => {
    triggerSound('CLICK');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setGameState('IDLE');
    setReactionTime(null);
    setActiveColorOption(null);
    setWrongKeyPressed('');
  };

  // Central keyboard events engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const code = e.code;
      const keyUpper = e.key.toUpperCase();

      // Always allow Reset shortcut 'R' unless actively waiting / playing color mode with 'R'
      if (code === 'KeyR' && gameState !== 'NOW' && gameState !== 'WAITING') {
        handleReset();
        return;
      }

      if (gameState === 'WAITING') {
        // Any button pressed while waiting is a foul!
        e.preventDefault();
        handleTooEarlyFoul();
        return;
      }

      if (gameState === 'NOW') {
        if (mode === 'COLOR') {
          if (!activeColorOption) return;
          
          // Must hit 'R' (KeyR), 'G' (KeyG), or 'B' (KeyB)
          if (code === activeColorOption.key || keyUpper === activeColorOption.char) {
            e.preventDefault();
            handleSuccess();
          } else if (['KeyR', 'KeyG', 'KeyB'].includes(code) || ['R', 'G', 'B'].includes(keyUpper)) {
            e.preventDefault();
            handleWrongColorChoice(keyUpper);
          }
        } else {
          // Visual and Audio mode only require 'Space' to score
          if (code === 'Space') {
            e.preventDefault();
            handleSuccess();
          }
        }
      } else {
        // When IDLE / RESULT / TOO_EARLY / INCORRECT_KEY, press Space is a restart shortcut
        if (code === 'Space') {
          e.preventDefault();
          handleStart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, mode, activeColorOption, soundEnabled]);

  // Clean up any pending timeouts only when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Color theme generator for main container
  const getContainerStyles = () => {
    switch (gameState) {
      case 'WAITING':
        return 'bg-amber-400 bg-none border-amber-500 shadow-amber-300 text-stone-900';
      
      case 'NOW':
        if (mode === 'COLOR' && activeColorOption) {
          return `${activeColorOption.tailwindBgClass} border-slate-700 animate-pulse`;
        }
        // Visual mode: bright green signal
        return 'bg-[#00ff66] bg-none border-emerald-450 shadow-emerald-400 text-slate-950 animate-pulse font-bold';
      
      case 'TOO_EARLY':
      case 'INCORRECT_KEY':
        return 'bg-rose-500 bg-none border-rose-600 shadow-rose-400 text-white';
      
      case 'RESULT':
        return 'bg-slate-900 bg-none border-slate-950 shadow-slate-900 text-white';
      
      case 'IDLE':
      default:
        return 'bg-linear-to-b from-slate-800 to-slate-900 border-slate-950 shadow-slate-900 text-slate-100';
    }
  };

  // Get rank text and description feedback
  const getRankBadgeAndFeedback = (ms: number) => {
    if (ms < 160) {
      return {
        badge: '⚡ 雷神等級 (Godlike)',
        bg: 'bg-violet-600/20 text-violet-300 border-violet-500/30',
        quote: '您的反應直逼大脳神經傳導物理極限！簡直就像暫停了時間！',
      };
    }
    if (ms < 210) {
      return {
        badge: '🐆 獵豹等級 (Cheetah)',
        bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
        quote: '太快了！這個速度足以在各種類型電競比賽中傲視群雄！',
      };
    }
    if (ms < 270) {
      return {
        badge: '🐇 兔子等級 (Rabbit)',
        bg: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        quote: '身手敏捷、專注度極高，水準上乘的反射素質。',
      };
    }
    if (ms < 380) {
      return {
        badge: '🚶 人類等級 (Human)',
        bg: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
        quote: '非常安全。符合日常大眾、過馬路跟開車時看紅綠燈的標準速率。',
      };
    }
    return {
      badge: '🐢 樹懶等級 (Sloth)',
      bg: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
      quote: '有一點遲鈍噢，是不是累了？調整一下手指坐姿，再接再厲！',
    };
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Settings Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-2xl border border-gray-150 shadow-2xs gap-3">
        {/* Three Active Game Mode Buttons (Requested: Multi-modes support) */}
        <div className="flex flex-wrap gap-1 p-1 bg-gray-50 rounded-xl border border-gray-150">
          <button
            onClick={() => {
              triggerSound('CLICK');
              setMode('VISUAL');
              if (gameState !== 'IDLE') handleReset();
            }}
            disabled={gameState === 'WAITING' || gameState === 'NOW'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 ${
              mode === 'VISUAL'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-800 hover:bg-gray-200/50'
            }`}
            id="btn-mode-visual"
          >
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            視覺變色
          </button>
          <button
            onClick={() => {
              triggerSound('CLICK');
              setMode('AUDIO');
              if (gameState !== 'IDLE') handleReset();
            }}
            disabled={gameState === 'WAITING' || gameState === 'NOW'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 ${
              mode === 'AUDIO'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-800 hover:bg-gray-200/50'
            }`}
            id="btn-mode-audio"
          >
            <Radio className="w-3.5 h-3.5 text-purple-500" />
            聽覺音效
          </button>
          <button
            onClick={() => {
              triggerSound('CLICK');
              setMode('COLOR');
              if (gameState !== 'IDLE') handleReset();
            }}
            disabled={gameState === 'WAITING' || gameState === 'NOW'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 ${
              mode === 'COLOR'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-slate-800 hover:bg-gray-200/50'
            }`}
            id="btn-mode-color"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-500" />
            顏色辨識
          </button>
        </div>

        {/* Audio control and guidelines info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg transition-colors border hover:bg-gray-50 ${
              soundEnabled
                ? 'text-gray-600 border-gray-200'
                : 'text-gray-400 border-gray-150 bg-gray-50'
            }`}
            id="btn-toggle-sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            <span className="font-bold">{soundEnabled ? '音頻開啟' : '靜音測試'}</span>
          </button>

          <div className="hidden md:flex items-center gap-1 text-slate-400 text-xs font-medium">
            <Keyboard className="w-4 h-4" />
            <span>
              {mode === 'COLOR' ? (
                <span>顏色對應鍵: <kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono font-bold text-slate-600">R</kbd>、<kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono font-bold text-slate-600">G</kbd>、<kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono font-bold text-slate-600">B</kbd></span>
              ) : (
                <span>單擊或 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono font-bold text-slate-600">Space</kbd> 作答 / <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono font-bold text-slate-600">R</kbd> 重置</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main interactive Click/Tap Arena Grid */}
      <div
        onClick={handleAction}
        id="reaction-test-arena"
        className={`w-full min-h-[410px] rounded-3xl border-4 transition-all duration-150 relative cursor-pointer select-none flex flex-col justify-center items-center p-6 shadow-md ${getContainerStyles()}`}
      >
        {/* Target Background Ring Decors */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 overflow-hidden">
          <div className="w-96 h-96 rounded-full border-4 border-current animate-spin-slow"></div>
          <div className="w-72 h-72 rounded-full border-2 border-dashed border-current absolute"></div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* STATE 1: IDLE */}
          {gameState === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="text-center p-4 flex flex-col items-center gap-4 max-w-md z-10"
            >
              <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600/30 text-emerald-400">
                <PlayCircle className="w-8 h-8 animate-pulse" />
              </div>
              
              <div>
                <span className="text-[10px] tracking-widest font-extrabold uppercase bg-indigo-505/20 px-2.5 py-1 text-slate-400 rounded-full border border-slate-700">
                  {mode === 'VISUAL' ? '視覺變色測試' : mode === 'AUDIO' ? '音階聽覺測試' : '顏色辨識選擇測試'}
                </span>
                <h2 className="text-2xl font-black font-sans tracking-tight text-white mt-2">
                  準備挑戰反應速限
                </h2>
                
                <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                  {mode === 'VISUAL' && '當灰色背景一瞬間轉變為【鮮綠色】時，以電競級速按空白鍵或任意處！'}
                  {mode === 'AUDIO' && '戴上耳機專注集中。在聽到【嗶】聲信號的同步，按下空白鍵或任意處解鎖反應！'}
                  {mode === 'COLOR' && '挑戰大腦對顏色的辨識能力！當畫面變色時，立刻按下對應鍵（紅色 R、綠色 G、藍色 B），或直接觸控點擊畫面上正確的色彩按鈕！'}
                </p>
              </div>

              <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-6 rounded-2xl">
                <span className="text-emerald-400 text-xs sm:text-sm font-black animate-pulse">
                  👉 點此處或按 [Space] 開始 👈
                </span>
              </div>

              {/* High score badges */}
              <div className="flex gap-2.5 mt-2 flex-wrap justify-center">
                {mode === 'VISUAL' && bestVisual && (
                  <span className="text-[10px] text-amber-250 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
                    🏆 視覺最佳: {bestVisual} ms
                  </span>
                )}
                {mode === 'AUDIO' && bestAudio && (
                  <span className="text-[10px] text-purple-200 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-mono">
                    🏆 聽覺最佳: {bestAudio} ms
                  </span>
                )}
                {mode === 'COLOR' && bestColor && (
                  <span className="text-[10px] text-emerald-250 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                    🏆 辨色最佳: {bestColor} ms
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* STATE 2: WAITING */}
          {gameState === 'WAITING' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-4 flex flex-col items-center gap-4 z-10"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 absolute top-12 animate-ping" />
              <div className="w-14 h-14 rounded-full bg-amber-600/30 flex items-center justify-center text-stone-900 border border-amber-500/20">
                <Zap className="w-7 h-7 animate-bounce" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-stone-900">屏住呼吸，全身貫注，等待信號...</h2>
                <p className="text-stone-850 font-bold text-xs mt-1.5 max-w-xs mx-auto animate-pulse">
                  {mode === 'VISUAL' && '一變為亮綠色就立刻作出點擊！'}
                  {mode === 'AUDIO' && '耳朵專注聽！一發起「嗶」一聲就立即按！'}
                  {mode === 'COLOR' && '準備辨識畫面色彩！如果是紅色按 R、綠色按 G、藍色按 B！'}
                </p>
              </div>

              <span className="text-stone-900 font-extrabold text-[10px] bg-amber-500/40 px-3 py-1 rounded-full uppercase border border-amber-500/50 mt-2 animate-pulse tracking-wider">
                切勿在訊號出現前搶按！
              </span>
            </motion.div>
          )}

          {/* STATE 3: NOW SHOW SIGNAL */}
          {gameState === 'NOW' && (
            <motion.div
              key="now"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-2 flex flex-col items-center justify-center gap-4 z-10 w-full"
            >
              {mode === 'COLOR' && activeColorOption ? (
                // Choice reaction rendering
                <div className="space-y-6 w-full max-w-md">
                  <div className="space-y-1">
                    <span className="bg-slate-950/25 border border-slate-950/20 text-slate-950 text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full inline-block">
                      注意畫面指示！
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 flex flex-col items-center gap-2">
                      <span>這是 {activeColorOption.name.split(' (')[0]}！</span>
                    </h1>
                    <p className="text-slate-950 font-black text-sm tracking-wide">
                      按鍵盤 <kbd className="bg-slate-950 text-white font-mono px-1.5 py-0.5 rounded font-extrabold mx-0.5">{activeColorOption.char}</kbd> 鍵，或直接按下方的對應按鈕！
                    </p>
                  </div>

                  {/* High usability tappable controls on touchscreens */}
                  <div className="grid grid-cols-3 gap-3 pt-4 w-full px-2" onClick={(e) => e.stopPropagation()}>
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.char}
                        onClick={(e) => handleColorChoiceClick(opt, e)}
                        className={`py-3.5 sm:py-5 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 font-bold text-sm tracking-wide transition-all border shadow-md ${
                          opt.char === activeColorOption.char
                            ? `bg-slate-950 border-slate-950 text-white animate-bounce scale-103`
                            : 'bg-white/80 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${opt.char === 'R' ? 'bg-red-500' : opt.char === 'G' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <span className="text-xs sm:text-sm font-black">{opt.name.split(' (')[0]}</span>
                        <span className="text-[10px] font-bold bg-gray-100 px-1 py-0.5 rounded border font-mono tracking-normal text-slate-600 block sm:inline-block">
                          鍵盤 [{opt.char}]
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Simple Space reflex rendering
                <div className="space-y-2">
                  <h1 className="text-6xl sm:text-8xl font-black tracking-widest text-slate-950 select-none animate-bounce">
                    現在點擊！
                  </h1>
                  <p className="text-slate-950 font-black text-lg sm:text-xl mt-4 animate-pulse tracking-wide italic">
                    PRESS / CLICK NOW !
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* STATE 4: FOUL - TOO EARLY */}
          {gameState === 'TOO_EARLY' && (
            <motion.div
              key="too-early"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-4 flex flex-col items-center gap-4 max-w-sm z-10"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">犯規！太早點了！</h2>
                <p className="text-rose-100 text-xs mt-1 leading-relaxed">
                  大腦神經太敏感囉。請耐心等到【亮綠色】或【嗶音信號】升起時，才能點擊，否則會破壞精確度測試資料。
                </p>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart();
                  }}
                  className="bg-white text-rose-600 hover:bg-rose-50 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  再挑戰一次
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  返回
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 4B: WRONG KEY / DISCRIMINATION ERROR */}
          {gameState === 'INCORRECT_KEY' && (
            <motion.div
              key="wrong-key"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-4 flex flex-col items-center gap-4 max-w-sm z-10"
            >
              <div className="w-14 h-14 rounded-full bg-slate-950/20 flex items-center justify-center text-white border border-white/25">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="bg-rose-950/20 border border-rose-300/30 text-rose-100 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  選擇性心理辨識錯誤
                </span>
                <h3 className="text-2xl font-black text-white mt-1.5">按錯按鈕或按鍵了！</h3>
                
                <p className="text-rose-100 text-xs mt-1 mb-2 leading-relaxed">
                  提示畫面需要對應的是 <span className="underline font-black">{activeColorOption?.name.split(' (')[0]}</span>，而您剛點按了 <span className="bg-slate-950 py-0.5 px-2 rounded-md border border-white/20 font-black font-mono">[{wrongKeyPressed}]</span>！
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart();
                  }}
                  className="bg-white text-rose-600 hover:bg-rose-100 px-5  py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  秒速再戰 (Space)
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="bg-slate-800 text-slate-100 hover:bg-slate-750 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  返回
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 5: PERFORMANCE DISPLAY */}
          {gameState === 'RESULT' && reactionTime !== null && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-4 flex flex-col items-center gap-4 w-full max-w-md z-10"
            >
              <div>
                <span className="text-[10px] tracking-widest text-slate-400 font-extrabold uppercase bg-slate-800 border border-slate-700 py-1 px-3.5 rounded-full inline-block">
                  測試模式: {mode === 'VISUAL' ? '視覺變色' : mode === 'AUDIO' ? '聽覺嗶聲' : '顏色心理辨識'}
                </span>
                
                <div className="flex items-baseline justify-center gap-1.5 mt-2">
                  <motion.span
                    initial={{ textShadow: "0 0 0px rgba(99,102,241,0)" }}
                    animate={{ textShadow: "0 0 25px rgba(16,185,129,0.7)" }}
                    className="text-6xl sm:text-7xl font-black font-mono text-emerald-400 tracking-tight"
                  >
                    {reactionTime}
                  </motion.span>
                  <span className="text-lg text-slate-400 font-bold font-mono">ms</span>
                </div>
              </div>

              {/* Reflex Rank badge description */}
              <div className={`w-full p-4 rounded-xl border ${getRankBadgeAndFeedback(reactionTime).bg} text-center`}>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {getRankBadgeAndFeedback(reactionTime).badge}
                </span>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed font-semibold">
                  {getRankBadgeAndFeedback(reactionTime).quote}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center mt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleStart()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:scale-103 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  再次挑戰 (Space)
                </button>
                <button
                  onClick={() => handleReset()}
                  className="bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  重置回主面板 (R)
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono block">
                本次模式歷史最佳為：{' '}
                <span className="font-bold text-emerald-400 font-mono">
                  {mode === 'VISUAL' 
                    ? `${bestVisual || reactionTime} ms` 
                    : mode === 'AUDIO'
                    ? `${bestAudio || reactionTime} ms`
                    : `${bestColor || reactionTime} ms`}
                </span>
              </span>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
