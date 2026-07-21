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
const AVAILABLE_EMOJIS = ['✏️', '📖', '📚', '📝', '🧹', '🥛', '🏃', '🎹', '🎨', '🧠', '🧩', '🔭', '🦄', '🌈', '🍄', '🏰'];

const INITIAL_MISSIONS: Mission[] = [
  { id: '1', text: '매일 수학 학습지 또는 문제집 2장 풀기', emoji: '✏️', completed: false, isDefault: true },
  { id: '2', text: '재미있는 과학·모험 책 15분 동안 읽기', emoji: '📖', completed: false, isDefault: true },
  { id: '3', text: '기억하고 싶은 멋진 영어 단어 5개 쓰고 읽기', emoji: '📚', completed: false, isDefault: true },
  { id: '4', text: '내가 가지고 놀 장난감과 책 스스로 제자리에 정리하기', emoji: '🧹', completed: false, isDefault: true }
];

export default function App() {
  // State variables
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewardText, setRewardText] = useState('시원하고 맛있는 초코 아이스크림 하나 먹기! 🍦');
  const [stampCount, setStampCount] = useState<number>(0);
  const [stampedDates, setStampedDates] = useState<string[]>([]);
  const [finalGiftText, setFinalGiftText] = useState('레고 마법의 성 선물세트! 🏰✨');
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

  // Generate the floating background doodles once so they don't shift on every state change
  const backgroundStars = useMemo(() => {
    const shapes = ['⭐', '🍄', '🦋', '🌸', '✨', '🎀', '🌈', '🌷', '🍀', '🐝', '🎈', '💖'];
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 14 + 14,
      delay: Math.random() * 4,
      opacity: Math.random() * 0.3 + 0.25,
      shape: shapes[i % shapes.length]
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

  // 1. Initial Load
  useEffect(() => {
    // Load missions
    const savedMissions = localStorage.getItem('mingyeol-missions');
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
    const savedReward = localStorage.getItem('mingyeol-reward');
    if (savedReward) {
      setRewardText(savedReward);
    }

    // Load stamps
    const savedStamps = localStorage.getItem('mingyeol-stamps');
    if (savedStamps) {
      setStampCount(parseInt(savedStamps) || 0);
    }

    // Load stamped dates
    const savedStampedDates = localStorage.getItem('mingyeol-stamped-dates');
    if (savedStampedDates) {
      try {
        setStampedDates(JSON.parse(savedStampedDates));
      } catch (e) {
        setStampedDates([]);
      }
    }

    // Load final gift
    const savedFinalGift = localStorage.getItem('mingyeol-final-gift');
    if (savedFinalGift) {
      setFinalGiftText(savedFinalGift);
    }

    // Load history
    const savedHistory = localStorage.getItem('mingyeol-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory({});
      }
    }

    // Load mute preference
    const savedMute = localStorage.getItem('mingyeol-muted');
    if (savedMute) {
      setIsMuted(savedMute === 'true');
    }

    // Prepare first quiz
    generateQuiz();
  }, []);

  // 2. Save state helpers
  const saveMissionsToStorage = (newMissions: Mission[]) => {
    localStorage.setItem('mingyeol-missions', JSON.stringify(newMissions));
  };

  const saveHistoryToStorage = (newHistory: Record<string, { completed: number; total: number }>) => {
    localStorage.setItem('mingyeol-history', JSON.stringify(newHistory));
  };

  const saveStampsToStorage = (count: number) => {
    localStorage.setItem('mingyeol-stamps', String(count));
  };

  const saveStampedDatesToStorage = (dates: string[]) => {
    localStorage.setItem('mingyeol-stamped-dates', JSON.stringify(dates));
  };

  const saveFinalGiftToStorage = (gift: string) => {
    localStorage.setItem('mingyeol-final-gift', gift);
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
        colors: ['#ff8fab', '#8b5cf6', '#ec4899', '#facc15', '#22c55e']
      });
      confetti({
        particleCount: isGrand ? 8 : 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.8 },
        colors: ['#ff8fab', '#8b5cf6', '#ec4899', '#facc15', '#22c55e']
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
    localStorage.setItem('mingyeol-reward', val);
  };

  const resetAllMissions = () => {
    if (window.confirm('정말 오늘 모험을 모두 처음 상태로 되돌릴까요?')) {
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
    if (window.confirm('기본 4가지 모험으로 초기화하시겠습니까? (추가하신 숙제는 삭제됩니다)')) {
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
    localStorage.setItem('mingyeol-muted', String(nextMute));
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
    <div id="mission-root-container" className="min-h-screen bg-transparent text-[#6b5a72] relative overflow-hidden flex flex-col justify-between font-sans selection:bg-[#ffd9e5] selection:text-[#6b5a72] pb-8">

      {/* 1. Floating pastel doodles drifting in the background */}
      <div id="cosmic-starfield" className="absolute inset-0 pointer-events-none z-0">
        {backgroundStars.map(star => (
          <span
            key={star.id}
            id={`star-${star.id}`}
            className="absolute animate-float select-none"
            style={{
              top: star.top,
              left: star.left,
              fontSize: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`
            }}
          >
            {star.shape}
          </span>
        ))}
        {/* Soft cotton-candy clouds */}
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-[#a5d8f5]/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[#ffc9dc]/40 rounded-full blur-[150px]" />
        <div className="absolute top-2/3 left-1/6 w-[260px] h-[260px] bg-[#ffe3b0]/40 rounded-full blur-[120px]" />
      </div>

      {/* Main interactive app wrapper */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-6 z-10 flex-grow flex flex-col justify-between">
        
        {/* App Header */}
        <header id="control-center-header" className="relative flex flex-col items-center justify-center text-center mb-6">
          
          {/* Sound toggle + status ribbon */}
          <div className="w-full flex justify-between items-center mb-3">
            <div className="bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-white text-xs font-mono font-semibold text-[#17604b] flex items-center gap-2 glow-mint">
              <span className="w-2 h-2 rounded-full bg-[#7ed3ba] animate-pulse"></span>
              <span>동화나라 입장 완료 🎀</span>
            </div>
            
            <button
              id="sound-toggle-btn"
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all duration-300 border flex items-center justify-center ${
                isMuted 
                ? 'bg-[#ffe9ec] border-[#f6c9d1] text-[#c94257] hover:bg-[#ffdae0]' 
                : 'bg-white/85 border-[#ffc2d4] text-[#286b92] hover:bg-[#e4f3ff] shadow-[0_4px_10px_rgba(255,143,171,0.25)]'
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
            <div className="text-sm tracking-wide font-mono font-semibold text-[#7c5cbf] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#ffc266] animate-wiggle" />
              <span>오늘도 반짝반짝 동화나라 모험</span>
              <Sparkles size={16} className="text-[#ffc266] animate-wiggle" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold title-candy tracking-tight leading-tight mt-1 select-none">
              🏰 민결이의 오늘 동화나라 모험!
            </h1>

            {/* Date badge */}
            <div className="mt-3.5 px-4 py-1.5 bg-white border-2 border-white rounded-full shadow-[0_4px_12px_rgba(186,150,190,0.18)] flex items-center gap-2">
              <Calendar size={16} className="text-[#286b92]" />
              <span className="text-[#286b92] text-base font-bold tracking-wide">{todayString}</span>
            </div>

            {/* Little adventurer status line */}
            <p className="text-xs text-[#6f6079] font-mono mt-2.5 tracking-wide flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-[#e4f3ff] rounded-full text-[#286b92] font-semibold">🌈 기분 최고</span>
              <span className="px-2 py-0.5 bg-[#fff1e0] rounded-full text-[#96620d] font-semibold">✨ 마법가루 가득</span>
              <span className="px-2 py-0.5 bg-[#eafaf5] rounded-full text-[#17604b] font-semibold">💖 용기 100%</span>
            </p>
          </motion.div>
        </header>

        {/* 2. Storybook Adventure Path — from cottage to the magic castle */}
        <section id="rocket-flight-path" className="candy-card rounded-[32px] p-6 mb-6 relative">

          <div className="flex justify-between items-center text-xs font-mono text-[#286b92] mb-4 px-1 select-none">
            <span className="flex items-center gap-1">🏡 우리 집 (출발!)</span>
            <span className="font-bold text-[#96620d]">
              {totalMissions > 0
                ? `모험 진행: ${completedMissions}/${totalMissions} (${Math.round(progressPercent)}%)`
                : '등록된 모험이 없어요'}
            </span>
            <span className="flex items-center gap-1">🏰 마법의 성 (도착!)</span>
          </div>

          <div className="relative h-12 flex items-center px-4">
            {/* Winding storybook road */}
            <div className="absolute inset-x-8 h-2.5 bg-[#eadfd0] rounded-full overflow-hidden border border-[#e0d2bf]">
              {/* Rainbow trail filling in as the adventure progresses */}
              <div
                className="h-full bg-gradient-to-r from-[#ff9ec4] via-[#ffd98e] to-[#8fdcc7] transition-all duration-700 ease-out shadow-[0_2px_8px_rgba(255,158,196,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Flower stepping-stones marking each mission */}
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
                      scale: mission.completed ? [1, 1.35, 1] : 1,
                      rotate: mission.completed ? [0, -12, 12, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[11px] font-black cursor-pointer transition-colors duration-300 ${
                      mission.completed
                      ? 'bg-[#ffe07a] border-white text-[#6b5a72] shadow-[0_4px_10px_rgba(255,208,122,0.8)]'
                      : 'bg-white border-[#ecdcc7] text-[#a58f79] font-mono'
                    }`}
                    onClick={() => toggleMission(mission.id)}
                  >
                    {mission.completed ? '🌸' : idx + 1}
                  </motion.div>
                </div>
              );
            })}

            {/* Cozy cottage at the start */}
            <div className="absolute -left-4 z-20 w-11 h-11 rounded-full home-badge animate-float flex items-center justify-center text-lg" style={{ animationDelay: '0.2s' }}>🏡</div>

            {/* The little traveler — a hot air balloon drifting along the trail! */}
            <motion.div
              className="absolute z-20 pointer-events-none flex flex-col items-center"
              style={{ y: -6 }}
              animate={{
                left: `calc(${progressPercent}% - 14px)`,
              }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            >
              <div className="relative animate-float">
                <span className="text-3xl block drop-shadow-[0_4px_6px_rgba(180,140,190,0.35)]">🎈</span>
                {/* Sparkle trail while the balloon is travelling */}
                {progressPercent > 0 && !isAllCompleted && (
                  <span className="absolute -left-3 top-1 text-xs animate-thrust">✨</span>
                )}
              </div>
            </motion.div>

            {/* Magic castle at the destination */}
            <div className="absolute -right-3 z-20 w-11 h-11 rounded-full castle-badge animate-float flex items-center justify-center text-lg" style={{ animationDelay: '1.5s' }}>🏰</div>
          </div>

          {/* Motivational storybook line */}
          <div className="mt-4 text-center text-sm font-bold text-[#286b92]">
            {isAllCompleted ? (
              <span className="text-[#17604b] font-extrabold flex items-center justify-center gap-1.5 animate-bounce">
                🎉 우와! 오늘 모험을 모두 끝냈어요! 마법의 성에서 선물을 받아요! 🏰
              </span>
            ) : (
              <span>남은 모험: <span className="text-[#96620d] font-extrabold">{totalMissions - completedMissions}개</span>! 조금만 더 힘내요, 용감한 민결 모험가님! 💪</span>
            )}
          </div>
        </section>

        {/* 2.5 마법 스탬프 정원 (Stamp Garden Board) */}
        <section id="space-stamp-station" className="candy-card rounded-[32px] p-6 mb-6 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#f7edf4] pb-4 mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#5c4c64] flex items-center gap-2">
                🌈 마법 스탬프 정원 <span className="text-[#96620d]">({stampCount}/30)</span>
              </h2>
              <p className="text-xs text-[#6f6079] mt-1">
                오늘의 모든 모험을 끝내면 매일 <span className="text-[#c33c64] font-bold">1개</span>의 마법 스탬프를 받아요!
              </p>
            </div>
            
            <div className="bg-[#fff7fb] border border-[#f4e6f0] rounded-2xl px-4 py-2 text-right">
              <span className="block text-[10px] font-mono text-[#7c5cbf] font-extrabold uppercase tracking-wider">스탬프 30개 보물 상자</span>
              <span className="text-sm font-bold text-[#96620d]">{finalGiftText}</span>
            </div>
          </div>

          {/* Stamp Grid (30 slots) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, idx) => {
              const isEarned = idx < stampCount;
              const isLast = idx === 29;
              
              const emojis = ['⭐', '🌸', '🦋', '🍄', '🌈', '👑', '🦄', '🎈', '💎', '🧚'];
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
                        ? 'bg-gradient-to-br from-[#ffe1ea] to-[#ffc9dc] border-[#ff8fab] shadow-[0_0_12px_rgba(255,143,171,0.4)] text-2xl'
                        : isLast 
                          ? 'bg-[#f5f0ff] border-dashed border-[#c9b6f5] text-[#7d6d86] text-lg'
                          : 'bg-[#fff7fb] border-[#f0e2ec] text-[#746679] text-xs font-mono font-bold'
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
                      <div className="absolute inset-0 rounded-full border-2 border-[#ffd98e] animate-ping opacity-60 pointer-events-none" />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Stamp board reward status message */}
          <div className="mt-5 pt-4 border-t border-[#f7edf4] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#ff8fab] animate-pulse" />
              <span className="text-xs text-[#7d6d86] font-medium">
                {stampCount === 30 ? (
                  <span className="text-[#17604b] font-extrabold">🎉 우와! 마법 스탬프 30개를 모두 모았어요! 보물 상자를 열어요! 🎉</span>
                ) : (
                  <span>선물 획득까지 남은 스탬프: <span className="text-[#c33c64] font-bold">{30 - stampCount}개</span></span>
                )}
              </span>
            </div>
            
            {stampCount === 30 && (
              <button
                onClick={() => {
                  playSound('success', isMuted);
                  setShowGrandCelebration(true);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-[#ffbf5e] to-[#ff9f3d] text-[#5a3608] font-black text-xs rounded-full shadow-[0_6px_14px_rgba(255,190,110,0.5)] hover:from-[#ffdb9a] hover:to-[#ffc98a] active:scale-95 cursor-pointer"
              >
🏆 보물 상자 열러가기!
              </button>
            )}
          </div>
        </section>

        {/* 3. Core Study Mission Todo Cards (Mingyeol's Panel) */}
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
                className={`group rounded-[32px] p-5 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-between select-none ${
                  mission.completed
                  ? 'candy-item-done'
                  : 'bg-white border-white shadow-[0_6px_16px_rgba(186,150,190,0.16)] hover:border-[#ffc9dc] hover:shadow-[0_10px_22px_rgba(255,143,171,0.22)] hover:translate-y-[-3px]'
                }`}
              >
                {/* Completed background sparkle decoration */}
                {mission.completed && (
                  <>
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#ffd9e5] rounded-full blur-xl pointer-events-none" />
                    <span className="absolute top-2 right-3 text-sm animate-wiggle pointer-events-none">✨</span>
                  </>
                )}

                <div className="flex items-center gap-3.5 mr-4 flex-grow">
                  {/* Circle Emoji Icon Box */}
                  <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                    mission.completed 
                    ? 'bg-[#ffd9e5] rotate-12 scale-105' 
                    : 'bg-[#fdeef5] border border-[#f0e2ec] group-hover:scale-110'
                  }`}>
                    {mission.emoji}
                  </div>

                  {/* Task Text with child friendly layout */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-wide text-[#7c5cbf] font-semibold">
                      모험 {index + 1}
                    </span>
                    <span className={`text-[17px] sm:text-lg font-bold leading-snug transition-all duration-300 ${
                      mission.completed
                      ? 'text-[#8a5c72] line-through decoration-[#ff8fab]/70 decoration-2'
                      : 'text-[#5c4c64]'
                    }`}>
                      {mission.text}
                    </span>
                  </div>
                </div>

                {/* Gigantic touch friendly checkbox */}
                <div className="shrink-0 ml-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${
                    mission.completed
                    ? 'bg-[#ff8fab] border-white text-white scale-110 shadow-[0_6px_14px_rgba(255,143,171,0.5)]'
                    : 'border-[#ffc9dc] hover:border-[#ff8fab] bg-[#fff7fb]'
                  }`}>
                    {mission.completed ? (
                      <Check size={24} strokeWidth={4} />
                    ) : (
                      <div className="w-3.5 h-3.5 bg-[#e8d8e4] rounded-full group-hover:bg-[#ff8fab] transition-colors" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {missions.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-10 text-center bg-[#fff7fb] rounded-2xl border border-[#f0e2ec] text-[#6f6079]">
              <span className="text-4xl block mb-2">🍄</span>
              오늘 떠날 동화나라 모험이 아직 하나도 없어요.<br />
              하단의 <strong className="text-[#286b92]">부모님 관리 센터</strong>에서 새로운 모험을 추가해주세요!
            </div>
          )}
        </main>

        {/* Quick Info Ribbon */}
        <div className="bg-[#eff7ff] border border-[#cfe7f8] rounded-xl p-3 flex items-start gap-2.5 mb-8 text-xs text-[#286b92] select-none">
          <Info size={16} className="text-[#286b92] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            민결아! 오늘의 소중한 숙제 모험을 하나씩 끝내고 카드를 콕 눌러줘!
            모든 모험을 완수하면 마법의 성에서 멋진 칭찬 보상 카드를 받을 수 있어! 🌟
          </p>
        </div>

        {/* 4. Parent Control Section (Sub-deck Panel) */}
        <section id="parent-admin-deck" className="candy-card rounded-[32px] overflow-hidden shadow-lg transition-all duration-500">
          
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
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#fdf4fa] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings size={18} className="text-[#7c5cbf] animate-wiggle" />
              <span className="font-extrabold text-[#6f4fb3] text-[15px] sm:text-base tracking-wide">
                ⚙️ 부모님 관리 센터 (학습 내용 수정 및 보상 설정)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isParentUnlocked ? (
                <span className="bg-[#e8f9f3] text-[#17604b] text-xs px-2 py-0.5 rounded-full border border-[#a9e5d3] flex items-center gap-1 font-mono font-bold">
                  <Unlock size={11} /> UNLOCKED
                </span>
              ) : (
                <span className="bg-[#f3edff] text-[#6f4fb3] text-xs px-2.5 py-0.5 rounded-full border border-[#d8c8f5] flex items-center gap-1 font-mono">
                  <Lock size={11} /> LOCKED
                </span>
              )}
              {showParentPanel ? <ChevronUp size={18} className="text-[#7c5cbf]" /> : <ChevronDown size={18} className="text-[#7c5cbf]" />}
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
                className="border-t border-[#f7edf4]"
              >
                <div className="p-5 sm:p-6 bg-transparent">
                  
                  {/* Gate 1: Security Math Quiz for Children Prevention */}
                  {!isParentUnlocked ? (
                    <div id="parent-security-lock" className="max-w-md mx-auto text-center py-6 px-4 bg-[#f7f3ff] rounded-xl border border-[#e6dcfa]">
                      <Lock size={36} className="mx-auto text-[#7c5cbf] mb-2 animate-bounce" />
                      <h3 className="text-base font-bold text-[#6f4fb3] mb-1">진짜 엄마, 아빠가 맞나요?</h3>
                      <p className="text-xs text-[#7c5cbf] mb-4 leading-relaxed">
                        민결이가 실수로 숙제 내용을 수정하지 못하도록 설정한 안전 잠금장치입니다.<br/> 아래의 덧셈 문제를 맞혀서 잠금을 해제해주세요.
                      </p>
                      
                      <form onSubmit={unlockParentQuiz} className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
                        <div className="text-xl font-bold font-mono tracking-wide text-[#6f4fb3]">
                          {quizQuestion.num1} + {quizQuestion.num2} = 
                        </div>
                        <input
                          type="number"
                          value={quizInput}
                          onChange={(e) => setQuizInput(e.target.value)}
                          placeholder="정답 입력"
                          className="w-24 px-3 py-2 text-center bg-[#fff7fb] border border-[#c9b6f5] rounded-lg text-lg font-bold font-mono text-[#5f43a0] focus:outline-none focus:border-[#b09be0] focus:ring-1 focus:ring-[#c9b6f5]"
                        />
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-[#8b6fd0] to-[#7a5cc4] text-sm font-bold rounded-lg hover:from-[#9d86d4] hover:to-[#8b73c9] active:scale-95 transition-all text-white font-sans"
                        >
                          확인
                        </button>
                      </form>

                      {quizError && (
                        <p className="text-xs text-[#c94257] font-bold mt-3 animate-pulse">
                          앗! 계산 결과가 다릅니다. 다시 한번 계산해 보시거나, 새로고침 해보세요.
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Gate 2: Unlocked Parent Admin Tools */
                    <div id="parent-admin-tools" className="space-y-6">
                      
                      <div className="flex justify-between items-center pb-2.5 border-b border-[#ece4fc]">
                        <span className="text-xs text-[#7c5cbf]">
                          ※ 부모님이 등록한 오늘의 모험은 브라우저 쿠키(LocalStorage)에 안전하게 저장됩니다.
                        </span>
                        <button
                          onClick={lockParentPanel}
                          className="px-3 py-1 bg-[#f3edff] hover:bg-[#e9dfff] border border-[#d8c8f5] text-xs text-[#6f4fb3] rounded-md font-sans flex items-center gap-1"
                        >
                          <Lock size={12} /> 설정 완료 (잠금)
                        </button>
                      </div>

                      {/* A. Create Custom Mission Form */}
                      <div>
                        <h4 className="text-sm font-bold text-[#6f4fb3] mb-2.5 flex items-center gap-1.5">
                          <Plus size={16} /> 1. 새로운 동화 모험 추가하기
                        </h4>
                        
                        <form onSubmit={addCustomMission} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Emoji Select Grid inside parent panel */}
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-bold text-[#6f6079] mb-1">아이콘 선택</label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-[#fff7fb] rounded-lg border border-[#e6dcfa] max-h-[74px] overflow-y-auto">
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
                                    ? 'bg-[#8b6fd0] text-white scale-110 shadow-[0_4px_10px_rgba(176,155,224,0.5)]' 
                                    : 'hover:bg-[#fdeef5]'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Text input */}
                          <div className="sm:col-span-6 flex flex-col justify-end">
                            <label className="block text-xs font-bold text-[#6f6079] mb-1">오늘 공부/숙제 제목</label>
                            <input
                              type="text"
                              value={newText}
                              onChange={(e) => setNewText(e.target.value)}
                              placeholder="예) 수학 구몬 구구단 공부하기, 피아노 3번 연주하기"
                              maxLength={45}
                              className="w-full h-[38px] px-3 bg-[#fff7fb] border border-[#ded1f7] rounded-lg text-sm text-[#5c4c64] placeholder:text-[#7d6d86] focus:outline-none focus:border-[#b09be0]"
                            />
                          </div>

                          {/* Add button */}
                          <div className="sm:col-span-2 flex flex-col justify-end">
                            <button
                              type="submit"
                              className="w-full h-[38px] bg-[#8b6fd0] hover:bg-[#9d86d4] text-sm font-bold rounded-lg transition-all active:scale-95 text-white flex items-center justify-center gap-1"
                            >
                              <Plus size={16} /> 모험 추가
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* B. Current Mission Management & Removal List */}
                      <div>
                        <h4 className="text-sm font-bold text-[#6f4fb3] mb-2 flex items-center gap-1.5">
                          <Trash2 size={16} /> 2. 현재 모험 목록 관리 및 삭제
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {missions.map((mission, index) => (
                            <div
                              key={`manage-${mission.id}`}
                              className="flex items-center justify-between p-2.5 bg-[#fff7fb] rounded-lg border border-[#ece4fc] hover:border-[#e6dcfa] text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-[#7c5cbf] font-bold">#{index + 1}</span>
                                <span className="bg-[#fdeef5] px-1.5 py-0.5 rounded text-base">{mission.emoji}</span>
                                <span className="text-[#6b5a72] font-bold">{mission.text}</span>
                                {mission.completed && (
                                  <span className="text-[10px] bg-[#e8f9f3] text-[#17604b] px-1.5 py-0.5 rounded-full border border-[#a9e5d3]">완료함</span>
                                )}
                              </div>
                              <button
                                onClick={() => deleteMission(mission.id)}
                                className="p-1.5 text-[#c94257] hover:text-[#c94257] hover:bg-[#ffe9ec] rounded transition-all"
                                title="모험 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {missions.length === 0 && (
                            <p className="text-xs text-[#7d6d86] py-2">현재 추가된 모험이 없습니다.</p>
                          )}
                        </div>
                      </div>

                      {/* C. Reward Customization Input */}
                      <div>
                        <h4 className="text-sm font-bold text-[#6f4fb3] mb-1.5 flex items-center gap-1.5">
                          <Trophy size={16} className="text-[#96620d]" /> 3. 오늘의 최종 완료 보상 문구 설정
                        </h4>
                        <p className="text-[11px] text-[#6f6079] mb-2">
                          오늘의 모든 모험을 다 성공했을 때 팝업 화면에 띄워 줄 민결이만의 특별 선물·혜택을 적어주세요.
                        </p>
                        <input
                          type="text"
                          value={rewardText}
                          onChange={(e) => changeReward(e.target.value)}
                          placeholder="예) 맛있는 딸기 요플레 먹기 🍓, 게임 시간 30분 자유권 🎮"
                          className="w-full px-3 py-2 bg-[#fff7fb] border border-[#ded1f7] rounded-lg text-sm text-[#5c4c64] focus:outline-none focus:border-[#b09be0]"
                        />
                      </div>

                      {/* D. 30 Stamps Milestone Customization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#f0eafd]">
                        <div>
                          <h4 className="text-sm font-bold text-[#6f4fb3] mb-1.5 flex items-center gap-1.5">
                            <Gift size={16} className="text-[#c33c64]" /> 4. 30개 스탬프 최종 선물 문구 설정
                          </h4>
                          <p className="text-[11px] text-[#6f6079] mb-2">
                            스탬프를 30개 모두 모았을 때 민결이가 받을 최종 대형 선물을 설정해주세요.
                          </p>
                          <input
                            type="text"
                            value={finalGiftText}
                            onChange={(e) => {
                              setFinalGiftText(e.target.value);
                              saveFinalGiftToStorage(e.target.value);
                            }}
                            placeholder="예) 마트에서 원하는 대형 장난감 하나 고르기! 🎁"
                            className="w-full px-3 py-2 bg-[#fff7fb] border border-[#ded1f7] rounded-lg text-sm text-[#5c4c64] focus:outline-none focus:border-[#b09be0]"
                          />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-[#6f4fb3] mb-1.5 flex items-center gap-1.5">
                            <Star size={16} className="text-[#96620d]" /> 5. 현재 획득 스탬프 개수 직접 수정
                          </h4>
                          <p className="text-[11px] text-[#6f6079] mb-2">
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
                              className="px-3 py-2 bg-[#fff7fb] hover:bg-[#fdeef5] border border-[#e6dcfa] rounded-lg text-sm font-bold text-[#6b5a72] cursor-pointer"
                            >
                              - 1개
                            </button>
                            <div className="w-16 text-center text-lg font-black text-[#c33c64] font-mono select-none">
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
                              className="px-3 py-2 bg-[#fff7fb] hover:bg-[#fdeef5] border border-[#e6dcfa] rounded-lg text-sm font-bold text-[#6b5a72] cursor-pointer"
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
                              className="ml-auto px-2.5 py-2 bg-[#ffe9ec] hover:bg-[#ffdae0] border border-[#f6c9d1] text-[#c94257] rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              전체 초기화
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* E. Adventure Logs (Past History Stats) */}
                      <div>
                        <h4 className="text-sm font-bold text-[#6f4fb3] mb-1.5 flex items-center gap-1.5">
                          <Calendar size={16} /> 6. 최근 7일 동화 모험 성공 로그
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
                                  ? 'bg-[#e4f3ff] border-[#8ecdf7] ring-1 ring-[#a5d8f5]/50'
                                  : isCompletedAll
                                  ? 'bg-[#e8f9f3] border-[#a9e5d3]'
                                  : 'bg-[#fff7fb] border-[#f4e6f0]'
                                }`}
                              >
                                <span className="block text-[11px] font-mono text-[#6f6079]">{displayDate}</span>
                                <span className="block text-[10px] font-bold text-[#7d6d86] mb-1">
                                  {dateStr === todayKey ? '오늘' : '동화모험'}
                                </span>
                                {dayRecord ? (
                                  <div className="text-xs">
                                    <span className={`font-bold ${isCompletedAll ? 'text-[#17604b]' : 'text-[#96620d]'}`}>
                                      {dayRecord.completed}/{dayRecord.total}
                                    </span>
                                    <span className="block text-[10px] mt-0.5">
                                      {isCompletedAll ? '🌟 완벽성공' : '🌙 아직 모험 중'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#746679] block py-1">- 기록없음</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* F. Fast Reset Operations */}
                      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-[#ece4fc]">
                        <button
                          type="button"
                          onClick={resetAllMissions}
                          className="px-4 py-2 bg-[#ffbf5e] hover:bg-[#ffd189] text-xs font-bold text-[#5a3608] rounded-lg transition-colors flex items-center gap-1 font-sans"
                        >
                          <RotateCcw size={13} /> 오늘 하루 안 푼 상태로 되돌리기 (체크 초기화)
                        </button>
                        <button
                          type="button"
                          onClick={restoreDefaultMissions}
                          className="px-4 py-2 bg-[#fff7fb] hover:bg-[#fdeef5] text-xs font-bold text-[#7d6d86] border border-[#f0e2ec] rounded-lg transition-colors flex items-center gap-1 font-sans"
                        >
                          기본 모험 4개로 초기화
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
      <footer className="w-full text-center text-[10px] text-[#7d6d86] font-mono select-none mt-8 z-10">
        🏰 민결이의 동화나라 모험 수첩 © 2026. Made with a storybook heart.
      </footer>

      {/* 5. Gorgeous Full-Screen Success Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div id="celebration-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fff6fa]/92 backdrop-blur-[20px]">
            {/* Ambient glowing stardust under the card */}
            <div className="absolute w-[350px] h-[350px] bg-[#c9b6f5]/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] bg-[#ffb3c9]/25 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 80 }}
              className="bg-white/95 backdrop-blur-[15px] w-full max-w-lg rounded-[32px] border border-[#f4e6f0] p-6 sm:p-8 text-center shadow-[0_18px_40px_rgba(186,150,190,0.3)] relative overflow-hidden select-none"
            >
              {/* Storybook decorations inside the pop */}
              <div className="absolute -top-10 -left-10 text-7xl opacity-15 animate-float transform rotate-12">
                🦄
              </div>
              <div className="absolute -bottom-10 -right-10 text-7xl opacity-15 animate-float transform -rotate-12" style={{ animationDelay: '2s' }}>
                🍄
              </div>

              {/* Glowing Medal Header */}
              <div className="relative mb-5 inline-block">
                <div className="absolute inset-0 bg-[#ff8fab] rounded-full blur-xl opacity-40 animate-pulse" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, repeatType: 'reverse' }}
                  className="w-20 h-20 bg-gradient-to-b from-[#ffe9a8] to-[#ffcf7a] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(255,217,142,0.6)] border-2 border-white relative z-10"
                >
                  <Trophy size={40} className="text-[#6b5a72] fill-white/40" />
                </motion.div>
              </div>

              {/* Title Header */}
              <h2 className="text-3xl sm:text-4xl font-black title-candy tracking-tight leading-snug mb-2">
                🏆 모험 성공!
              </h2>
              <p className="text-lg font-bold text-[#286b92] mb-6">
                용감한 민결 모험가님, 정말 대단해요! 🌟
              </p>

              {/* Parent customized Reward Card */}
              <div className="bg-[#fff7fb] border border-[#f4e6f0] p-5 rounded-[24px] mb-7 relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[8px] font-mono text-[#7c5cbf] font-extrabold tracking-wide select-none">칭찬 쿠폰 🎀</div>
                
                <span className="block text-xs font-bold text-[#6f6079] mb-1.5 text-center">🎖️ 오늘의 모험 완수 보상 🎖️</span>
                <span className="block text-lg sm:text-xl font-extrabold text-[#c33c64] leading-snug">
                  {rewardText || "칭찬의 하이파이브와 안아주기! 💖"}
                </span>
              </div>

              <p className="text-xs text-[#6f6079] mb-6 leading-relaxed">
                엄마 또는 아빠에게 이 화면을 보여드리고 멋진 오늘의 보상을 약속받으세요!<br/>
                내일도 신나는 동화나라 모험 🏰 을 떠나보자!
              </p>

              {/* Close Celebration Screen */}
              <button
                onClick={() => {
                  setShowCelebration(false);
                  playSound('click', isMuted);
                }}
                className="w-full py-4 bg-[#d03860] hover:bg-[#ee5c85] text-white font-extrabold rounded-full text-lg tracking-wide transition-all shadow-[0_8px_18px_rgba(208,56,96,0.35)] hover:shadow-[0_10px_22px_rgba(208,56,96,0.45)] active:scale-[0.98] cursor-pointer"
              >
고마워요! 모험 성공 완료 🎖️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Grand 30-Stamps Celebration Modal */}
      <AnimatePresence>
        {showGrandCelebration && (
          <div id="grand-celebration-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fdf6ff]/92 backdrop-blur-[25px]">
            {/* Pulsing light effect under the card */}
            <div className="absolute w-[450px] h-[450px] bg-[#ffd98e]/35 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute w-[450px] h-[450px] bg-[#ffb3c9]/35 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 12, stiffness: 70 }}
              className="bg-white/95 border-2 border-[#ff8fab] w-full max-w-xl rounded-[40px] p-8 text-center shadow-[0_0_60px_rgba(255,143,171,0.4)] relative overflow-hidden select-none"
            >
              {/* Storybook graphics */}
              <div className="absolute -top-6 -left-6 text-8xl opacity-15 animate-float">🦄</div>
              <div className="absolute -bottom-6 -right-6 text-8xl opacity-15 animate-float" style={{ animationDelay: '3s' }}>🏰</div>
              <div className="absolute top-1/4 right-5 text-4xl opacity-15 animate-pulse">🌈</div>
              <div className="absolute bottom-1/3 left-5 text-4xl opacity-15 animate-pulse" style={{ animationDelay: '1.5s' }}>✨</div>

              {/* Glowing Fairytale Crown */}
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-[#ffd98e] rounded-full blur-2xl opacity-50 animate-ping pointer-events-none" />
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="w-24 h-24 bg-gradient-to-tr from-[#ffd98e] via-[#ffe9a8] to-[#ffc98a] rounded-full flex items-center justify-center shadow-[0_10px_26px_rgba(255,217,142,0.6)] border-4 border-white relative z-10"
                >
                  <span className="text-5xl">👑</span>
                </motion.div>
              </div>

              {/* Titles */}
              <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff9a4d] via-[#ff8fab] to-[#9d86d4] tracking-tight leading-snug mb-3">
                동화나라 대모험 완성!
              </h2>
              <p className="text-lg font-bold text-[#6b5a72] mb-6 px-4">
                용감한 민결 모험가님, 마법 스탬프 30개를 모두 모아 마법의 성에 무사히 도착했어요! 정말 위대해요! 🏰❤️
              </p>

              {/* Giant Prize box details */}
              <div className="bg-[#fffaf0] border-2 border-[#ffd98e] p-6 rounded-[28px] mb-8 relative overflow-hidden shadow-[inset_0_2px_10px_rgba(255,217,142,0.25)]">
                <div className="absolute top-1.5 right-3 text-[9px] font-mono text-[#96620d] font-extrabold tracking-widest">스탬프 30개 보물 상자 🏆</div>
                <span className="block text-xs font-bold text-[#6f6079] mb-2">🎁 민결이를 기다리는 진짜 초대형 보물 🎁</span>
                <span className="block text-xl sm:text-2xl font-black text-[#96620d] leading-snug drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  {finalGiftText}
                </span>
              </div>

              <div className="text-xs text-[#6f6079] space-y-2 mb-8 px-2 leading-relaxed">
                <p>
                  엄마, 아빠! 약속하셨던 대망의 30일 보상 선물을 민결이에게 전달해주세요! 😍
                </p>
                <p>
                  민결이의 엄청난 성실함과 노력을 가득 칭찬해 주시고 많이 안아주세요! ✨
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowGrandCelebration(false);
                    playSound('click', isMuted);
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-[#ffbf5e] to-[#ff9f3d] text-[#5a3608] font-black rounded-full text-base tracking-wide transition-all shadow-[0_8px_18px_rgba(255,190,110,0.45)] hover:shadow-[0_10px_22px_rgba(255,190,110,0.55)] hover:from-[#ffdb9a] hover:to-[#ffc98a] active:scale-[0.98] cursor-pointer"
                >
                  기쁘게 선물 받기 💖
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("마법 스탬프를 다시 처음부터 모으시겠습니까? (스탬프 개수가 0개로 초기화됩니다)")) {
                      setStampCount(0);
                      saveStampsToStorage(0);
                      setStampedDates([]);
                      saveStampedDatesToStorage([]);
                      setShowGrandCelebration(false);
                      playSound('success', isMuted);
                    }
                  }}
                  className="py-4 px-6 bg-white hover:bg-[#fdf4fa] border-2 border-[#f0e2ec] text-[#6f4fb3] font-bold rounded-full text-sm tracking-wide transition-all active:scale-[0.98] cursor-pointer"
                >
새로운 30일 모험 시작하기 🌈
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
