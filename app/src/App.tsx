/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Check, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Settings, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Info,
  Gift,
  Star
} from 'lucide-react';
import { Mission } from './types';

// Web Audio API Synthesizer for high-quality game-like retro space sounds
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Sound playback function
function playSound(type: 'click' | 'check' | 'uncheck' | 'success', isMuted: boolean) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'check') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'uncheck') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, now); // G4
      osc.frequency.linearRampToValueAtTime(261.63, now + 0.12); // C4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'success') {
      // Cosmic upbeat melody: C5 -> E5 -> G5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.12, now + i * 0.09);
        gain.gain.setValueAtTime(0.12, now + i * 0.09 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.18);
      });
    }
  } catch (err) {
    console.warn('Audio feedback failed to play', err);
  }
}

// List of available fun emojis for tasks
const AVAILABLE_EMOJIS = ['✏️', '🚀', '📚', '📝', '🧹', '🥛', '🏃', '🎹', '🎨', '🧠', '🧩', '🧪', '🪐', '💡'];

const INITIAL_MISSIONS: Mission[] = [
  { id: '1', text: '매일 수학 학습지 또는 문제집 2장 풀기', emoji: '✏️', completed: false, isDefault: true },
  { id: '2', text: '재미있는 과학/우주 책 15분 동안 읽기', emoji: '🚀', completed: false, isDefault: true },
  { id: '3', text: '기억하고 싶은 멋진 영어 단어 5개 쓰고 읽기', emoji: '📚', completed: false, isDefault: true },
  { id: '4', text: '내가 가지고 놀 장난감과 책 스스로 제자리에 정리하기', emoji: '🧹', completed: false, isDefault: true }
];

export default function App() {
  // State variables
  const [childName, setChildName] = useState('민건');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewardText, setRewardText] = useState('시원하고 맛있는 초코 아이스크림 하나 먹기! 🍦');
  const [stampCount, setStampCount] = useState<number>(0);
  const [stampedDates, setStampedDates] = useState<string[]>([]);
  const [finalGiftText, setFinalGiftText] = useState('레고 시티 우주정거장 선물세트! 🌌📦');
  const [showGrandCelebration, setShowGrandCelebration] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Parent panel state
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [showParentPanel, setShowParentPanel] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [quizInput, setQuizInput] = useState('');
  const [quizError, setQuizError] = useState(false);
  
  // Custom task form state
  const [newText, setNewText] = useState('');
  const [newEmoji, setNewEmoji] = useState('✏️');
  
  // Daily History log state
  const [history, setHistory] = useState<Record<string, { completed: number; total: number }>>({});

  // Generate background stars once so they don't shift on every state change
  const backgroundStars = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.7 + 0.3
    }));
  }, []);

  // Today's formatted date
  const todayString = useMemo(() => {
    const d = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }, []);

  // YYYY-MM-DD format for local history key
  const todayKey = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  // Familiar Korean form of the name (e.g. 민건 → 민건이, 민수 → 민수), which always
  // ends in a vowel so the following 의/가/를/에게… particles stay grammatical for any name.
  const famName = useMemo(() => {
    const n = childName.trim();
    if (!n) return '민건이';
    const code = n.charCodeAt(n.length - 1);
    const isHangul = code >= 0xac00 && code <= 0xd7a3;
    const hasBatchim = isHangul && (code - 0xac00) % 28 !== 0;
    return hasBatchim ? n + '이' : n;
  }, [childName]);

  // Vocative form used when calling out to the child (민건 → 민건아, 민수 → 민수야).
  const vocativeName = useMemo(() => {
    const n = childName.trim();
    if (!n) return '민건아';
    const code = n.charCodeAt(n.length - 1);
    const isHangul = code >= 0xac00 && code <= 0xd7a3;
    const hasBatchim = isHangul && (code - 0xac00) % 28 !== 0;
    return hasBatchim ? n + '아' : n + '야';
  }, [childName]);

  // Keep the browser tab / installed-app title in sync with the chosen name.
  useEffect(() => {
    document.title = `${famName}의 우주 미션 체크 웹앱`;
  }, [famName]);

  // 1. Initial Load
  useEffect(() => {
    // Load child name
    const savedName = localStorage.getItem('mingeon-child-name');
    if (savedName && savedName.trim()) {
      setChildName(savedName);
    }

    // Load missions
    const savedMissions = localStorage.getItem('mingeon-missions');
    if (savedMissions) {
      try {
        setMissions(JSON.parse(savedMissions));
      } catch (e) {
        setMissions(INITIAL_MISSIONS);
      }
    } else {
      setMissions(INITIAL_MISSIONS);
    }

    // Load reward
    const savedReward = localStorage.getItem('mingeon-reward');
    if (savedReward) {
      setRewardText(savedReward);
    }

    // Load stamps
    const savedStamps = localStorage.getItem('mingeon-stamps');
    if (savedStamps) {
      setStampCount(parseInt(savedStamps) || 0);
    }

    // Load stamped dates
    const savedStampedDates = localStorage.getItem('mingeon-stamped-dates');
    if (savedStampedDates) {
      try {
        setStampedDates(JSON.parse(savedStampedDates));
      } catch (e) {
        setStampedDates([]);
      }
    }

    // Load final gift
    const savedFinalGift = localStorage.getItem('mingeon-final-gift');
    if (savedFinalGift) {
      setFinalGiftText(savedFinalGift);
    }

    // Load history
    const savedHistory = localStorage.getItem('mingeon-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory({});
      }
    }

    // Load mute preference
    const savedMute = localStorage.getItem('mingeon-muted');
    if (savedMute) {
      setIsMuted(savedMute === 'true');
    }

    // Prepare first quiz
    generateQuiz();
  }, []);

  // 2. Save state helpers
  const saveMissionsToStorage = (newMissions: Mission[]) => {
    localStorage.setItem('mingeon-missions', JSON.stringify(newMissions));
  };

  const saveHistoryToStorage = (newHistory: Record<string, { completed: number; total: number }>) => {
    localStorage.setItem('mingeon-history', JSON.stringify(newHistory));
  };

  const saveStampsToStorage = (count: number) => {
    localStorage.setItem('mingeon-stamps', String(count));
  };

  const saveStampedDatesToStorage = (dates: string[]) => {
    localStorage.setItem('mingeon-stamped-dates', JSON.stringify(dates));
  };

  const saveFinalGiftToStorage = (gift: string) => {
    localStorage.setItem('mingeon-final-gift', gift);
  };

  // Generate simple random parent verification quiz (e.g., addition up to 20 or multiplication of single digits)
  const generateQuiz = () => {
    const num1 = Math.floor(Math.random() * 8) + 6; // 6 ~ 13
    const num2 = Math.floor(Math.random() * 7) + 5; // 5 ~ 11
    setQuizQuestion({
      num1,
      num2,
      answer: num1 + num2
    });
    setQuizInput('');
    setQuizError(false);
  };

  // 3. Mission Status Toggle
  const toggleMission = (id: string) => {
    const updated = missions.map(m => {
      if (m.id === id) {
        const nextCompletedState = !m.completed;
        playSound(nextCompletedState ? 'check' : 'uncheck', isMuted);
        return { ...m, completed: nextCompletedState };
      }
      return m;
    });

    setMissions(updated);
    saveMissionsToStorage(updated);

    // Update today's history log
    const completedCount = updated.filter(m => m.completed).length;
    const totalCount = updated.length;
    const updatedHistory = {
      ...history,
      [todayKey]: { completed: completedCount, total: totalCount }
    };
    setHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);

    // Check if everything is complete
    if (completedCount === totalCount && totalCount > 0) {
      // Award a stamp if not already earned today!
      let awardedStamp = false;
      let newCount = stampCount;
      if (!stampedDates.includes(todayKey)) {
        const nextDates = [...stampedDates, todayKey];
        setStampedDates(nextDates);
        saveStampedDatesToStorage(nextDates);
        
        newCount = Math.min(30, stampCount + 1);
        setStampCount(newCount);
        saveStampsToStorage(newCount);
        awardedStamp = true;
      }

      // Delay slightly for nice feeling
      setTimeout(() => {
        triggerSuccessCelebration(newCount === 30 && awardedStamp);
      }, 500);
    }
  };

  // 4. Trigger Celebration
  const triggerSuccessCelebration = (isGrand: boolean = false) => {
    playSound('success', isMuted);
    if (isGrand) {
      setShowGrandCelebration(true);
    } else {
      setShowCelebration(true);
    }

    // Launch beautiful high-performance starry confetti bursts
    const duration = isGrand ? 6 * 1000 : 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: isGrand ? 8 : 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.8 },
        colors: ['#00f2ff', '#8b5cf6', '#ec4899', '#facc15', '#22c55e']
      });
      confetti({
        particleCount: isGrand ? 8 : 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.8 },
        colors: ['#00f2ff', '#8b5cf6', '#ec4899', '#facc15', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // 5. Parent operations
  const unlockParentQuiz = (e: FormEvent) => {
    e.preventDefault();
    const num = parseInt(quizInput.trim());
    if (num === quizQuestion.answer) {
      setIsParentUnlocked(true);
      setShowParentPanel(true);
      setQuizError(false);
      playSound('success', isMuted);
    } else {
      setQuizError(true);
      setQuizInput('');
      playSound('uncheck', isMuted);
    }
  };

  const lockParentPanel = () => {
    setIsParentUnlocked(false);
    setShowParentPanel(false);
    generateQuiz();
    playSound('click', isMuted);
  };

  const addCustomMission = (e: FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newMission: Mission = {
      id: Date.now().toString(),
      text: newText.trim(),
      emoji: newEmoji,
      completed: false
    };

    const updated = [...missions, newMission];
    setMissions(updated);
    saveMissionsToStorage(updated);

    // Reset fields
    setNewText('');
    setNewEmoji('✏️');
    playSound('check', isMuted);

    // Update history ratios
    const completedCount = updated.filter(m => m.completed).length;
    const updatedHistory = {
      ...history,
      [todayKey]: { completed: completedCount, total: updated.length }
    };
    setHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);
  };

  const deleteMission = (id: string) => {
    const updated = missions.filter(m => m.id !== id);
    setMissions(updated);
    saveMissionsToStorage(updated);
    playSound('uncheck', isMuted);

    // Update history ratios
    const completedCount = updated.filter(m => m.completed).length;
    const updatedHistory = {
      ...history,
      [todayKey]: { completed: completedCount, total: updated.length }
    };
    setHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);
  };

  const changeReward = (val: string) => {
    setRewardText(val);
    localStorage.setItem('mingeon-reward', val);
  };

  const changeChildName = (val: string) => {
    const trimmed = val.slice(0, 10);
    setChildName(trimmed);
    localStorage.setItem('mingeon-child-name', trimmed);
  };

  const resetAllMissions = () => {
    if (window.confirm('정말 오늘 미션을 모두 처음 상태로 안 푼 것처럼 돌릴까요?')) {
      const updated = missions.map(m => ({ ...m, completed: false }));
      setMissions(updated);
      saveMissionsToStorage(updated);
      
      const updatedHistory = {
        ...history,
        [todayKey]: { completed: 0, total: updated.length }
      };
      setHistory(updatedHistory);
      saveHistoryToStorage(updatedHistory);

      playSound('uncheck', isMuted);
    }
  };

  const restoreDefaultMissions = () => {
    if (window.confirm('기본 4가지 우주 미션으로 초기화하시겠습니까? (추가하신 숙제는 삭제됩니다)')) {
      setMissions(INITIAL_MISSIONS);
      saveMissionsToStorage(INITIAL_MISSIONS);
      
      const updatedHistory = {
        ...history,
        [todayKey]: { completed: 0, total: INITIAL_MISSIONS.length }
      };
      setHistory(updatedHistory);
      saveHistoryToStorage(updatedHistory);

      playSound('success', isMuted);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('mingeon-muted', String(nextMute));
    if (!nextMute) {
      setTimeout(() => playSound('click', false), 50);
    }
  };

  // Derived progress values
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.completed).length;
  const progressPercent = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
  const isAllCompleted = totalMissions > 0 && completedMissions === totalMissions;

  return (
    <div id="mission-root-container" className="min-h-screen bg-space-deep text-white relative overflow-hidden flex flex-col justify-between font-sans selection:bg-cosmic-purple selection:text-white pb-8">
      
      {/* 1. Animated twinkling CSS Starfield in background */}
      <div id="cosmic-starfield" className="absolute inset-0 pointer-events-none z-0">
        {backgroundStars.map(star => (
          <div
            key={star.id}
            id={`star-${star.id}`}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              boxShadow: star.size > 2 ? '0 0 8px #ffffff' : 'none'
            }}
          />
        ))}
        {/* Glowing Nebula dust overlays */}
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Main interactive app wrapper */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 z-10 flex-grow flex flex-col justify-between">
        
        {/* App Header */}
        <header id="control-center-header" className="relative flex flex-col items-center justify-center text-center mb-6">
          
          {/* Sounds toggle and Space indicators */}
          <div className="w-full flex justify-between items-center mb-3">
            <div className="bg-space-dark/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-space-blue/60 text-xs font-mono text-blue-300 flex items-center gap-2 neon-glow-blue">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>COMMAND DECK CONNECTED</span>
            </div>
            
            <button
              id="sound-toggle-btn"
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all duration-300 border flex items-center justify-center ${
                isMuted 
                ? 'bg-red-950/40 border-red-800/60 text-red-400 hover:bg-red-900/50' 
                : 'bg-space-dark/80 border-space-glow/50 text-blue-400 hover:bg-blue-950/60 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              }`}
              title={isMuted ? "소리 켜기" : "소리 끄기"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="text-sm tracking-widest font-mono text-purple-400 font-bold flex items-center gap-1.5">
              <Sparkles size={16} className="text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>SPACE ADVENTURE MISSION</span>
              <Sparkles size={16} className="text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gold-shadow tracking-tight leading-none mt-1 select-none">
              🚀 {famName}의 오늘 우주 미션!
            </h1>

            {/* Glowing Earth Date badge */}
            <div className="mt-3.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-2">
              <Calendar size={16} className="text-blue-300" />
              <span className="text-blue-200 text-base font-bold tracking-wide">{todayString}</span>
            </div>

            {/* Astronaut info stat lines */}
            <p className="text-xs text-blue-300/80 font-mono mt-2 tracking-wider">
              🛸 궤도 고도: <span className="text-yellow-300">35,786 km</span> | 🔋 로켓 연료: <span className="text-green-400">100% 최적</span>
            </p>
          </motion.div>
        </header>

        {/* 2. Beautiful Orbital Rocket Progress Path */}
        <section id="rocket-flight-path" className="frosted-glass rounded-[32px] p-6 mb-6 relative">
          
          <div className="flex justify-between items-center text-xs font-mono text-blue-300/80 mb-4 px-1 select-none">
            <span className="flex items-center gap-1">🌍 지구 기지 (출발!)</span>
            <span className="font-bold text-yellow-300">
              {totalMissions > 0 
                ? `미션 성공률: ${completedMissions}/${totalMissions} (${Math.round(progressPercent)}%)` 
                : '등록된 우주 미션이 없어요'}
            </span>
            <span className="flex items-center gap-1">🌕 은하수 달나라 (목적지)</span>
          </div>

          <div className="relative h-12 flex items-center px-4">
            {/* Background orbital guide line */}
            <div className="absolute inset-x-8 h-2 bg-slate-800/90 rounded-full overflow-hidden">
              {/* Completed Glowing Green/Blue progress fill */}
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-green-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.6)]" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Interactive Stars/Milestone dots on the path */}
            {missions.map((mission, idx) => {
              const positionPct = totalMissions > 1 ? (idx / (totalMissions - 1)) * 92 + 4 : 50;
              return (
                <div
                  key={`checkpoint-${mission.id}`}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center z-10"
                  style={{ left: `${positionPct}%` }}
                >
                  <motion.div
                    animate={{
                      scale: mission.completed ? [1, 1.3, 1] : 1,
                      rotate: mission.completed ? 360 : 0
                    }}
                    transition={{ duration: 0.4 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono text-[10px] font-black cursor-pointer transition-colors duration-300 ${
                      mission.completed
                      ? 'bg-yellow-400 border-yellow-200 text-slate-900 shadow-[0_0_10px_#facc15]'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                    onClick={() => toggleMission(mission.id)}
                  >
                    {mission.completed ? '★' : idx + 1}
                  </motion.div>
                </div>
              );
            })}

            {/* Earth Station Globe */}
            <div className="absolute -left-4 z-20 w-11 h-11 rounded-full earth-sphere animate-float" style={{ animationDelay: '0.2s' }} />

            {/* Animated Flying Rocket on path! */}
            <motion.div 
              className="absolute z-20 pointer-events-none flex flex-col items-center"
              style={{ y: -4 }}
              animate={{ 
                left: `calc(${progressPercent}% - 14px)`,
              }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              {/* Animated rocket direction indicator */}
              <div className="relative">
                <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(0,242,255,0.7)] block transform -rotate-45">🚀</span>
                {/* Flame thrust effect when moving or active */}
                {progressPercent > 0 && !isAllCompleted && (
                  <div className="absolute -bottom-1.5 left-2 transform rotate-135 animate-thrust origin-top">
                    <Flame size={12} className="text-orange-500 fill-orange-500" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Moon Destination */}
            <div className="absolute -right-3 z-20 w-9 h-9 rounded-full moon-sphere animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Motivational space instruction */}
          <div className="mt-4 text-center text-sm font-bold text-blue-200">
            {isAllCompleted ? (
              <span className="text-green-400 font-extrabold flex items-center justify-center gap-1.5 animate-bounce">
                🎉 와아! 오늘 모든 미션을 해결했어요! 칭찬 보상을 받으러 가요! 🛰️
              </span>
            ) : (
              <span>오늘의 남은 임무: <span className="text-yellow-300 font-extrabold">{totalMissions - completedMissions}개</span>! 힘을 내요, {childName} 대장님! 💪</span>
            )}
          </div>
        </section>

        {/* 2.5 우주 스탬프 정거장 (Stamp Station Board) */}
        <section id="space-stamp-station" className="frosted-glass rounded-[32px] p-6 mb-6 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                🪐 우주 스탬프 정거장 <span className="text-yellow-300">({stampCount}/30)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                오늘의 모든 미션을 끝내면 매일 <span className="text-[#00f2ff] font-bold">1개</span>의 스탬프를 받아요!
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-right">
              <span className="block text-[10px] font-mono text-purple-400 font-extrabold uppercase tracking-wider">30 스탬프 최종 선물</span>
              <span className="text-sm font-bold text-yellow-300">{finalGiftText}</span>
            </div>
          </div>

          {/* Stamp Grid (30 slots) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, idx) => {
              const isEarned = idx < stampCount;
              const isLast = idx === 29;
              
              const emojis = ['⭐', '🪐', '👽', '🛸', '☄️', '🌟', '👨‍🚀', '🌌', '🚀', '🔮'];
              const stampEmoji = isLast ? '🎁' : emojis[idx % emojis.length];

              return (
                <div 
                  key={`stamp-slot-${idx}`}
                  className="flex flex-col items-center justify-center relative"
                >
                  <motion.div
                    whileHover={{ scale: isEarned ? 1.15 : 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                      isEarned
                        ? 'bg-gradient-to-br from-cyan-400/20 to-blue-600/30 border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.4)] text-2xl'
                        : isLast 
                          ? 'bg-purple-950/20 border-dashed border-purple-500/40 text-slate-500 text-lg'
                          : 'bg-slate-900/60 border-slate-800 text-slate-600 text-xs font-mono font-bold'
                    }`}
                  >
                    {isEarned ? (
                      <span className="animate-float" style={{ animationDelay: `${idx * 0.1}s` }}>
                        {stampEmoji}
                      </span>
                    ) : (
                      isLast ? '🎁' : idx + 1
                    )}
                    
                    {!isEarned && idx === stampCount && (
                      <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-60 pointer-events-none" />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Stamp board reward status message */}
          <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                {stampCount === 30 ? (
                  <span className="text-green-400 font-extrabold">🎉 대박! 스탬프 30개를 모두 채웠어요! 부모님께 선물을 보여드려요! 🎉</span>
                ) : (
                  <span>선물 획득까지 남은 스탬프: <span className="text-[#00f2ff] font-bold">{30 - stampCount}개</span></span>
                )}
              </span>
            </div>
            
            {stampCount === 30 && (
              <button
                onClick={() => {
                  playSound('success', isMuted);
                  setShowGrandCelebration(true);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:from-yellow-400 hover:to-amber-400 active:scale-95 cursor-pointer"
              >
                🏆 30개 보상 보러가기!
              </button>
            )}
          </div>
        </section>

        {/* 3. Core Study Mission Todo Cards (Mingeon's Panel) */}
        <main id="mission-cards-container" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <AnimatePresence mode="popLayout">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                layoutId={`card-layout-${mission.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                onClick={() => toggleMission(mission.id)}
                className={`group rounded-[32px] p-5 border cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between select-none ${
                  mission.completed
                  ? 'bg-[rgba(0,242,255,0.12)] border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.25)]'
                  : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(0,242,255,0.4)] hover:translate-y-[-2px]'
                }`}
              >
                {/* Completed background ripple decoration */}
                {mission.completed && (
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div className="flex items-center gap-3.5 mr-4 flex-grow">
                  {/* Circle Emoji Icon Box */}
                  <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                    mission.completed 
                    ? 'bg-cyan-500/20 rotate-12 scale-105' 
                    : 'bg-slate-850 border border-slate-700 group-hover:scale-110'
                  }`}>
                    {mission.emoji}
                  </div>

                  {/* Task Text with child friendly layout */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold">
                      MISSION {index + 1}
                    </span>
                    <span className={`text-[17px] sm:text-lg font-bold leading-snug transition-all duration-300 ${
                      mission.completed 
                      ? 'text-blue-200 line-through decoration-[#00f2ff]/60 decoration-2' 
                      : 'text-slate-100'
                    }`}>
                      {mission.text}
                    </span>
                  </div>
                </div>

                {/* Gigantic touch friendly checkbox */}
                <div className="shrink-0 ml-1">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center border-3 transition-all duration-300 ${
                    mission.completed
                    ? 'bg-[#00f2ff] border-[#00f2ff] text-slate-950 scale-105 shadow-[0_0_15px_#00f2ff]'
                    : 'border-[#00f2ff]/60 hover:border-[#00f2ff] bg-transparent'
                  }`}>
                    {mission.completed ? (
                      <Check size={24} strokeWidth={4} />
                    ) : (
                      <div className="w-3.5 h-3.5 bg-slate-700 rounded-full group-hover:bg-space-glow transition-colors" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {missions.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-10 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
              <span className="text-4xl block mb-2">🪐</span>
              현재 등록된 오늘의 우주 미션이 하나도 없어요.<br />
              하단의 <strong className="text-blue-400">부모님 관리 센터</strong>를 통해 새로운 미션을 추가해주세요!
            </div>
          )}
        </main>

        {/* Quick Info Ribbon */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 flex items-start gap-2.5 mb-8 text-xs text-blue-300 select-none">
          <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {vocativeName}! 매일 공부해야 하는 소중한 숙제들을 다 끝내고 초록색 버튼을 눌러줘!
            모든 미션을 완수하면 대단한 칭찬 보상 카드를 받을 수 있어! 🌟
          </p>
        </div>

        {/* 4. Parent Control Section (Sub-deck Panel) */}
        <section id="parent-admin-deck" className="frosted-glass rounded-[32px] overflow-hidden shadow-lg transition-all duration-500">
          
          {/* Header Bar */}
          <button
            onClick={() => {
              if (showParentPanel) {
                setShowParentPanel(false);
              } else {
                if (isParentUnlocked) {
                  setShowParentPanel(true);
                } else {
                  setShowParentPanel(true);
                }
              }
              playSound('click', isMuted);
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings size={18} className="text-purple-400 animate-spin-slow" />
              <span className="font-extrabold text-purple-200 text-[15px] sm:text-base tracking-wide">
                ⚙️ 부모님 관리 센터 (학습 내용 수정 및 보상 설정)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isParentUnlocked ? (
                <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1 font-mono font-bold">
                  <Unlock size={11} /> UNLOCKED
                </span>
              ) : (
                <span className="bg-purple-950/40 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1 font-mono">
                  <Lock size={11} /> LOCKED
                </span>
              )}
              {showParentPanel ? <ChevronUp size={18} className="text-purple-400" /> : <ChevronDown size={18} className="text-purple-400" />}
            </div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {showParentPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-white/5"
              >
                <div className="p-5 sm:p-6 bg-transparent">
                  
                  {/* Gate 1: Security Math Quiz for Children Prevention */}
                  {!isParentUnlocked ? (
                    <div id="parent-security-lock" className="max-w-md mx-auto text-center py-6 px-4 bg-purple-950/10 rounded-xl border border-purple-900/40">
                      <Lock size={36} className="mx-auto text-purple-400 mb-2 animate-bounce" />
                      <h3 className="text-base font-bold text-purple-200 mb-1">진짜 엄마, 아빠가 맞나요?</h3>
                      <p className="text-xs text-purple-300/80 mb-4 leading-relaxed">
                        {famName}가 실수로 숙제 내용을 수정하지 못하도록 설정한 안전 잠금장치입니다.<br/> 아래의 덧셈 문제를 맞혀서 잠금을 해제해주세요.
                      </p>
                      
                      <form onSubmit={unlockParentQuiz} className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
                        <div className="text-xl font-bold font-mono tracking-wide text-purple-200">
                          {quizQuestion.num1} + {quizQuestion.num2} = 
                        </div>
                        <input
                          type="number"
                          value={quizInput}
                          onChange={(e) => setQuizInput(e.target.value)}
                          placeholder="정답 입력"
                          className="w-24 px-3 py-2 text-center bg-slate-900 border border-purple-700/50 rounded-lg text-lg font-bold font-mono text-purple-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-sm font-bold rounded-lg hover:from-purple-600 hover:to-indigo-600 active:scale-95 transition-all text-white font-sans"
                        >
                          확인
                        </button>
                      </form>

                      {quizError && (
                        <p className="text-xs text-red-400 font-bold mt-3 animate-pulse">
                          앗! 계산 결과가 다릅니다. 다시 한번 계산해 보시거나, 새로고침 해보세요.
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Gate 2: Unlocked Parent Admin Tools */
                    <div id="parent-admin-tools" className="space-y-6">
                      
                      <div className="flex justify-between items-center pb-2.5 border-b border-purple-900/30">
                        <span className="text-xs text-purple-300/70">
                          ※ 부모님이 등록한 오늘의 미션은 브라우저 쿠키(LocalStorage)에 안전하게 저장됩니다.
                        </span>
                        <button
                          onClick={lockParentPanel}
                          className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-xs text-purple-300 rounded-md font-sans flex items-center gap-1"
                        >
                          <Lock size={12} /> 설정 완료 (잠금)
                        </button>
                      </div>

                      {/* 0. Child Name Setting */}
                      <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={16} className="text-yellow-300" /> 우리 아이 이름 설정
                        </h4>
                        <p className="text-[11px] text-slate-400 mb-2.5">
                          앱 곳곳의 이름(제목·칭찬 문구·축하 화면)이 아래 이름으로 바뀝니다. 다른 아이가 쓸 때 이름만 바꿔주세요.
                        </p>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="text"
                            value={childName}
                            onChange={(e) => changeChildName(e.target.value)}
                            placeholder="예) 민건, 민결, 서아"
                            maxLength={10}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-purple-700/50 rounded-lg text-sm font-bold text-purple-100 placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="shrink-0 text-xs text-slate-400 font-sans">
                            미리보기: <span className="text-yellow-300 font-bold">{famName}의 오늘 우주 미션!</span>
                          </span>
                        </div>
                      </div>

                      {/* A. Create Custom Mission Form */}
                      <div>
                        <h4 className="text-sm font-bold text-purple-300 mb-2.5 flex items-center gap-1.5">
                          <Plus size={16} /> 1. 새로운 우주 미션 추가하기
                        </h4>
                        
                        <form onSubmit={addCustomMission} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Emoji Select Grid inside parent panel */}
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-bold text-slate-400 mb-1">아이콘 선택</label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 rounded-lg border border-purple-900/40 max-h-[74px] overflow-y-auto">
                              {AVAILABLE_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setNewEmoji(emoji);
                                    playSound('click', isMuted);
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center text-base rounded-md transition-all ${
                                    newEmoji === emoji 
                                    ? 'bg-purple-600 text-white scale-110 shadow-[0_0_6px_#8b5cf6]' 
                                    : 'hover:bg-slate-800'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Text input */}
                          <div className="sm:col-span-6 flex flex-col justify-end">
                            <label className="block text-xs font-bold text-slate-400 mb-1">오늘 공부/숙제 제목</label>
                            <input
                              type="text"
                              value={newText}
                              onChange={(e) => setNewText(e.target.value)}
                              placeholder="예) 수학 구몬 구구단 공부하기, 피아노 3번 연주하기"
                              maxLength={45}
                              className="w-full h-[38px] px-3 bg-slate-900 border border-purple-900/60 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* Add button */}
                          <div className="sm:col-span-2 flex flex-col justify-end">
                            <button
                              type="submit"
                              className="w-full h-[38px] bg-purple-600 hover:bg-purple-500 text-sm font-bold rounded-lg transition-all active:scale-95 text-white flex items-center justify-center gap-1"
                            >
                              <Plus size={16} /> 미션 추가
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* B. Current Mission Management & Removal List */}
                      <div>
                        <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                          <Trash2 size={16} /> 2. 현재 미션 목록 관리 및 삭제
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {missions.map((mission, index) => (
                            <div
                              key={`manage-${mission.id}`}
                              className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-purple-950 hover:border-purple-900/40 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-purple-400 font-bold">#{index + 1}</span>
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-base">{mission.emoji}</span>
                                <span className="text-slate-200 font-bold">{mission.text}</span>
                                {mission.completed && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">완료함</span>
                                )}
                              </div>
                              <button
                                onClick={() => deleteMission(mission.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-all"
                                title="미션 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {missions.length === 0 && (
                            <p className="text-xs text-slate-500 py-2">현재 추가된 미션이 없습니다.</p>
                          )}
                        </div>
                      </div>

                      {/* C. Reward Customization Input */}
                      <div>
                        <h4 className="text-sm font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                          <Trophy size={16} className="text-yellow-400" /> 3. 오늘의 최종 완료 보상 문구 설정
                        </h4>
                        <p className="text-[11px] text-slate-400 mb-2">
                          오늘의 모든 미션을 다 성공했을 때 팝업 화면에 띄워 줄 {famName}만의 특별 선물/혜택을 적어주세요.
                        </p>
                        <input
                          type="text"
                          value={rewardText}
                          onChange={(e) => changeReward(e.target.value)}
                          placeholder="예) 맛있는 딸기 요플레 먹기 🍓, 게임 시간 30분 자유권 🎮"
                          className="w-full px-3 py-2 bg-slate-900 border border-purple-900/60 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* D. 30 Stamps Milestone Customization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-purple-900/20">
                        <div>
                          <h4 className="text-sm font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                            <Gift size={16} className="text-cyan-400" /> 4. 30개 스탬프 최종 선물 문구 설정
                          </h4>
                          <p className="text-[11px] text-slate-400 mb-2">
                            스탬프를 30개 모두 모았을 때 {famName}가 받을 최종 대형 선물을 설정해주세요.
                          </p>
                          <input
                            type="text"
                            value={finalGiftText}
                            onChange={(e) => {
                              setFinalGiftText(e.target.value);
                              saveFinalGiftToStorage(e.target.value);
                            }}
                            placeholder="예) 마트에서 원하는 대형 장난감 하나 고르기! 🎁"
                            className="w-full px-3 py-2 bg-slate-900 border border-purple-900/60 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                            <Star size={16} className="text-yellow-400" /> 5. 현재 획득 스탬프 개수 직접 수정
                          </h4>
                          <p className="text-[11px] text-slate-400 mb-2">
                            칭찬이나 격려용으로 스탬프 개수를 직접 조정하거나 수동으로 등록할 수 있습니다.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.max(0, stampCount - 1);
                                setStampCount(val);
                                saveStampsToStorage(val);
                                playSound('click', isMuted);
                              }}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-900/40 rounded-lg text-sm font-bold text-slate-200 cursor-pointer"
                            >
                              - 1개
                            </button>
                            <div className="w-16 text-center text-lg font-black text-[#00f2ff] font-mono select-none">
                              {stampCount} 개
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.min(30, stampCount + 1);
                                setStampCount(val);
                                saveStampsToStorage(val);
                                playSound('click', isMuted);
                                if (val === 30) {
                                  setShowGrandCelebration(true);
                                }
                              }}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-900/40 rounded-lg text-sm font-bold text-slate-200 cursor-pointer"
                            >
                              + 1개
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("스탬프를 정말 모두 지우고 0개부터 다시 시작하시겠습니까? (날짜별 스탬프 발급 기록도 함께 초기화됩니다)")) {
                                  setStampCount(0);
                                  saveStampsToStorage(0);
                                  setStampedDates([]);
                                  saveStampedDatesToStorage([]);
                                  playSound('uncheck', isMuted);
                                }
                              }}
                              className="ml-auto px-2.5 py-2 bg-red-950/60 hover:bg-red-900/60 border border-red-900/40 text-red-300 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              전체 초기화
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* E. Space Mission Logs (Past History Stats) */}
                      <div>
                        <h4 className="text-sm font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
                          <Calendar size={16} /> 6. 최근 7일 우주 미션 성공 로그
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                          {Array.from({ length: 7 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            const dateStr = `${d.getFullYear()}-${mm}-${dd}`;
                            const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
                            
                            const dayRecord = history[dateStr];
                            const isCompletedAll = dayRecord && dayRecord.completed === dayRecord.total && dayRecord.total > 0;
                            
                            return (
                              <div
                                key={dateStr}
                                className={`p-2.5 rounded-lg border text-center font-sans ${
                                  dateStr === todayKey
                                  ? 'bg-blue-950/40 border-blue-500/50 ring-1 ring-blue-500/20'
                                  : isCompletedAll
                                  ? 'bg-emerald-950/20 border-emerald-800/40'
                                  : 'bg-slate-900/40 border-slate-800/60'
                                }`}
                              >
                                <span className="block text-[11px] font-mono text-slate-400">{displayDate}</span>
                                <span className="block text-[10px] font-bold text-slate-500 mb-1">
                                  {dateStr === todayKey ? '오늘' : '우주미션'}
                                </span>
                                {dayRecord ? (
                                  <div className="text-xs">
                                    <span className={`font-bold ${isCompletedAll ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {dayRecord.completed}/{dayRecord.total}
                                    </span>
                                    <span className="block text-[10px] mt-0.5">
                                      {isCompletedAll ? '🌟 완벽성공' : '🛸 미완료'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600 block py-1">- 기록없음</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* F. Fast Reset Operations */}
                      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-purple-900/30">
                        <button
                          type="button"
                          onClick={resetAllMissions}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 font-sans"
                        >
                          <RotateCcw size={13} /> 오늘 하루 안 푼 상태로 되돌리기 (체크 초기화)
                        </button>
                        <button
                          type="button"
                          onClick={restoreDefaultMissions}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1 font-sans"
                        >
                          초기 기본 미션 4개로 초기화
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* Footer copyright spacer */}
      <footer className="w-full text-center text-[10px] text-slate-500/70 font-mono select-none mt-8 z-10">
        🚀 Commander Mingeon's Space Shuttle Control Center © 2026. Made with Space Scientist theme.
      </footer>

      {/* 5. Gorgeous Full-Screen Success Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div id="celebration-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-deep/90 backdrop-blur-[20px]">
            {/* Ambient glowing stardust under the card */}
            <div className="absolute w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 80 }}
              className="bg-slate-950/80 backdrop-blur-[15px] w-full max-w-lg rounded-[32px] border border-white/10 p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden select-none"
            >
              {/* Flying Rocket vector illustration decoration inside pop */}
              <div className="absolute -top-10 -left-10 text-7xl opacity-15 animate-float transform rotate-12">
                🛸
              </div>
              <div className="absolute -bottom-10 -right-10 text-7xl opacity-15 animate-float transform -rotate-12" style={{ animationDelay: '2s' }}>
                🪐
              </div>

              {/* Glowing Medal Header */}
              <div className="relative mb-5 inline-block">
                <div className="absolute inset-0 bg-[#00f2ff] rounded-full blur-xl opacity-40 animate-pulse" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, repeatType: 'reverse' }}
                  className="w-20 h-20 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_20px_#facc15] border-2 border-white relative z-10"
                >
                  <Trophy size={40} className="text-slate-900 fill-slate-900/40" />
                </motion.div>
              </div>

              {/* Title Header */}
              <h2 className="text-3xl sm:text-4xl font-black text-gold-shadow tracking-tight leading-snug mb-2">
                🏆 임무 성공!
              </h2>
              <p className="text-lg font-bold text-blue-200 mb-6">
                우주 비행사 {childName} 대장님, 대단해요! 🛰️
              </p>

              {/* Parent customized Reward Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-[24px] mb-7 relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[8px] font-mono text-purple-400 font-extrabold tracking-widest select-none">REWARD CERTIFICATE</div>
                
                <span className="block text-xs font-bold text-slate-400 mb-1.5 text-center">🎖️ 오늘의 미션 완수 보상 🎖️</span>
                <span className="block text-lg sm:text-xl font-extrabold text-[#00f2ff] leading-snug">
                  {rewardText || "칭찬의 하이파이브와 안아주기! 💖"}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                엄마 또는 아빠에게 이 화면을 보여드리고 멋진 오늘의 보상을 약속받으세요!<br/>
                내일도 멋진 우주선 🚀 비행을 떠나보자!
              </p>

              {/* Close Celebration Screen */}
              <button
                onClick={() => {
                  setShowCelebration(false);
                  playSound('click', isMuted);
                }}
                className="w-full py-4 bg-[#00f2ff] hover:bg-[#33f5ff] text-slate-950 font-extrabold rounded-full text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] active:scale-[0.98] cursor-pointer"
              >
                고마워요! 임무 성공 완료 🎖️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Grand 30-Stamps Celebration Modal */}
      <AnimatePresence>
        {showGrandCelebration && (
          <div id="grand-celebration-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/90 backdrop-blur-[25px]">
            {/* Pulsing light effect under the card */}
            <div className="absolute w-[450px] h-[450px] bg-yellow-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute w-[450px] h-[450px] bg-cyan-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 12, stiffness: 70 }}
              className="bg-slate-950/90 border-2 border-[#00f2ff] w-full max-w-xl rounded-[40px] p-8 text-center shadow-[0_0_60px_rgba(0,242,255,0.4)] relative overflow-hidden select-none"
            >
              {/* Space graphics */}
              <div className="absolute -top-6 -left-6 text-8xl opacity-15 animate-float">🛸</div>
              <div className="absolute -bottom-6 -right-6 text-8xl opacity-15 animate-float" style={{ animationDelay: '3s' }}>🪐</div>
              <div className="absolute top-1/4 right-5 text-4xl opacity-10 animate-pulse">✨</div>
              <div className="absolute bottom-1/3 left-5 text-4xl opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}>✨</div>

              {/* Glowing Space Crown/Medal */}
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50 animate-ping pointer-events-none" />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_#facc15] border-4 border-white relative z-10"
                >
                  <span className="text-5xl">👑</span>
                </motion.div>
              </div>

              {/* Titles */}
              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-[#00f2ff] tracking-tight leading-snug mb-3">
                은하계 최종 임무 성공!
              </h2>
              <p className="text-lg font-bold text-slate-200 mb-6 px-4">
                우주 비행사 {childName} 대장님, 30개의 스탬프를 모두 모아 우주정거장에 성공적으로 착륙했습니다! 정말 위대해요! 🛰️❤️
              </p>

              {/* Giant Prize box details */}
              <div className="bg-white/5 border-2 border-yellow-400/60 p-6 rounded-[28px] mb-8 relative overflow-hidden shadow-[inset_0_0_20px_rgba(250,204,21,0.1)]">
                <div className="absolute top-1.5 right-3 text-[9px] font-mono text-yellow-300 font-extrabold tracking-widest">30-STAMPS MEGA REWARD</div>
                <span className="block text-xs font-bold text-slate-400 mb-2">🎁 {famName}를 기다리는 진짜 초대형 선물 🎁</span>
                <span className="block text-xl sm:text-2xl font-black text-yellow-300 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {finalGiftText}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-2 mb-8 px-2 leading-relaxed">
                <p>
                  엄마, 아빠! 약속하셨던 대망의 30일 보상 선물을 {famName}에게 전달해주세요! 😍
                </p>
                <p>
                  {famName}의 엄청난 성실함과 노력을 가득 칭찬해 주시고 많이 안아주세요! ✨
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowGrandCelebration(false);
                    playSound('click', isMuted);
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-full text-base tracking-wide transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_25px_rgba(234,179,8,0.6)] hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] cursor-pointer"
                >
                  기쁘게 선물 받기 💖
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("우주 스탬프를 다시 처음부터 모으시겠습니까? (스탬프 개수가 0개로 초기화됩니다)")) {
                      setStampCount(0);
                      saveStampsToStorage(0);
                      setStampedDates([]);
                      saveStampedDatesToStorage([]);
                      setShowGrandCelebration(false);
                      playSound('success', isMuted);
                    }
                  }}
                  className="py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full text-sm tracking-wide transition-all active:scale-[0.98] cursor-pointer"
                >
                  새로운 30일 모험 시작하기 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
