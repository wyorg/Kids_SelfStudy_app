/**
 * 두 테마(우주/동화) 공통으로 쓰는 로직 모음.
 * - 효과음(Web Audio) 합성
 * - 한국어 조사용 이름 변형(받침 처리)
 * - 프로필 타입/저장 헬퍼
 */

export type Theme = 'space' | 'fairytale';

export interface Profile {
  id: string;   // localStorage 네임스페이스로도 쓰임 (예: 'mingeon', 'p-170...')
  name: string;
  theme: Theme;
}

// ---- Web Audio 효과음 ----
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

export function playSound(
  type: 'click' | 'check' | 'uncheck' | 'success',
  isMuted: boolean
) {
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
      osc.frequency.setValueAtTime(392.0, now); // G4
      osc.frequency.linearRampToValueAtTime(261.63, now + 0.12); // C4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
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

// ---- 한국어 조사용 이름 변형 ----
function lastHasBatchim(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  const code = n.charCodeAt(n.length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  return isHangul && (code - 0xac00) % 28 !== 0;
}

// 친근형(민건 → 민건이, 민수 → 민수). 항상 모음으로 끝나 뒤 조사(의/가/를/에게)가 자연스럽다.
export function famForm(name: string, fallback = '친구'): string {
  const n = name.trim() || fallback;
  return lastHasBatchim(n) ? n + '이' : n;
}

// 부르는 형(민건 → 민건아, 서아 → 서아야).
export function vocativeForm(name: string, fallback = '친구'): string {
  const n = name.trim() || fallback;
  return lastHasBatchim(n) ? n + '아' : n + '야';
}
