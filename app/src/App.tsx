/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shell: 여러 아이(프로필)를 관리하고, 각 프로필의 테마(우주/동화)에 맞는
 * 미션 화면을 렌더링합니다. 프로필마다 이름·테마·진도(미션/스탬프/기록)가
 * localStorage 에 네임스페이스(프로필 id)로 따로 저장됩니다.
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Lock, Plus, Trash2, Sparkles, Rocket, Castle } from 'lucide-react';
import { Profile, Theme, playSound } from './appShared';
import { famForm } from './appShared';
import SpaceApp from './themes/SpaceApp';
import FairytaleApp from './themes/FairytaleApp';

const PROFILES_KEY = 'kids-profiles';
const ACTIVE_KEY = 'kids-active-profile';

// 프로필을 지울 때 함께 정리할 네임스페이스별 저장 키 접미사
const DATA_SUFFIXES = [
  'missions',
  'reward',
  'stamps',
  'stamped-dates',
  'final-gift',
  'history',
  'muted',
  'child-name',
];

const THEME_LABEL: Record<Theme, string> = {
  space: '우주 미션',
  fairytale: '동화나라 모험',
};

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  // 최초 실행 / 복구: 기존 기본(우주) 데이터를 그대로 잇는 기본 프로필.
  // (id 'mingeon' 은 과거 저장 키 네임스페이스와의 호환을 위해 유지)
  const legacyName = localStorage.getItem('mingeon-child-name') || '우리 아이';
  return [{ id: 'mingeon', name: legacyName, theme: 'space' }];
}

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    return saved || '';
  });

  // Add-profile form state
  const [newName, setNewName] = useState('');
  const [newTheme, setNewTheme] = useState<Theme>('space');

  // 활성 프로필 보정 (저장된 active 가 없거나 지워졌을 때)
  const active = useMemo(() => {
    return profiles.find((p) => p.id === activeId) || profiles[0];
  }, [profiles, activeId]);

  // Persist profiles
  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);

  // Persist active id (and heal invalid)
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
    if (active) localStorage.setItem(ACTIVE_KEY, active.id);
  }, [active, activeId]);

  // Keep <html data-theme>, tab title, and mobile status-bar color in sync
  useEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute('data-theme', active.theme);
    document.title = `${famForm(active.name)}의 ${THEME_LABEL[active.theme]}`;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', active.theme === 'space' ? '#050714' : '#ffeaf3');
    }
  }, [active]);

  if (!active) return null;

  // ---- Profile operations ----
  const switchTo = (id: string) => {
    if (id === active.id) return;
    setActiveId(id);
    playSound('click', false);
  };

  const renameActive = (val: string) => {
    const name = val.slice(0, 10);
    setProfiles((prev) => prev.map((p) => (p.id === active.id ? { ...p, name } : p)));
  };

  const setActiveTheme = (theme: Theme) => {
    if (theme === active.theme) return;
    setProfiles((prev) => prev.map((p) => (p.id === active.id ? { ...p, theme } : p)));
    playSound('click', false);
  };

  const addProfile = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim().slice(0, 10);
    if (!name) return;
    const id = `p-${Date.now().toString(36)}`;
    const profile: Profile = { id, name, theme: newTheme };
    setProfiles((prev) => [...prev, profile]);
    setActiveId(id);
    setNewName('');
    setNewTheme('space');
    playSound('success', false);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      window.alert('마지막 한 명은 지울 수 없어요. 새 아이를 먼저 추가해주세요.');
      return;
    }
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    if (
      !window.confirm(
        `'${target.name}' 프로필과 그 아이의 모든 기록(미션·스탬프·달력)을 정말 삭제할까요? 되돌릴 수 없어요.`
      )
    )
      return;
    // 해당 프로필의 네임스페이스 데이터 정리
    DATA_SUFFIXES.forEach((s) => localStorage.removeItem(`${id}-${s}`));
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    if (id === active.id) setActiveId(remaining[0].id);
    playSound('uncheck', false);
  };

  // ---- Chrome: 프로필/테마 설정 (부모님 패널 안에 주입) ----
  const chrome = (
    <div className="kid-panel p-4 space-y-4">
      <h4 className="text-sm font-bold flex items-center gap-1.5">
        <Sparkles size={16} /> 아이 프로필 &amp; 테마 설정
      </h4>

      {/* 현재 아이 이름 */}
      <div>
        <label className="block text-[11px] font-bold kid-dim mb-1">현재 아이 이름</label>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={active.name}
            onChange={(e) => renameActive(e.target.value)}
            maxLength={10}
            placeholder="아이 이름 입력"
            className="kid-input flex-1 px-3 py-2 text-sm font-bold"
          />
          <span className="shrink-0 text-xs kid-dim">
            미리보기: <span className="kid-accent-ink font-bold">{famForm(active.name)}의 {THEME_LABEL[active.theme]}</span>
          </span>
        </div>
      </div>

      {/* 테마 선택 */}
      <div>
        <label className="block text-[11px] font-bold kid-dim mb-1">테마 (언제든 바꿀 수 있어요)</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTheme('space')}
            data-on={active.theme === 'space'}
            className="kid-seg flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Rocket size={15} /> 우주 미션
          </button>
          <button
            type="button"
            onClick={() => setActiveTheme('fairytale')}
            data-on={active.theme === 'fairytale'}
            className="kid-seg flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Castle size={15} /> 동화나라 모험
          </button>
        </div>
      </div>

      {/* 아이 목록 관리 */}
      <div>
        <label className="block text-[11px] font-bold kid-dim mb-1">아이 목록 ({profiles.length}명)</label>
        <div className="space-y-1.5">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => switchTo(p.id)}
                data-on={p.id === active.id}
                className="kid-chip flex-1 flex items-center gap-2 px-3 py-1.5 text-sm text-left"
              >
                {p.theme === 'space' ? <Rocket size={13} /> : <Castle size={13} />}
                <span className="font-bold">{p.name}</span>
                <span className="text-[10px] kid-dim">· {THEME_LABEL[p.theme]}</span>
                {p.id === active.id && <span className="ml-auto text-[10px] kid-accent-ink">보는 중</span>}
              </button>
              <button
                type="button"
                onClick={() => deleteProfile(p.id)}
                title="이 아이 삭제"
                className="kid-btn-ghost p-2"
                style={{ color: 'var(--kid-danger)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 새 아이 추가 */}
      <form onSubmit={addProfile}>
        <label className="block text-[11px] font-bold kid-dim mb-1">새 아이 추가</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={10}
            placeholder="아이 이름"
            className="kid-input flex-1 min-w-[120px] px-3 py-2 text-sm font-bold"
          />
          <button
            type="button"
            onClick={() => setNewTheme('space')}
            data-on={newTheme === 'space'}
            className="kid-seg flex items-center gap-1 px-3 py-2 text-xs"
          >
            <Rocket size={13} /> 우주
          </button>
          <button
            type="button"
            onClick={() => setNewTheme('fairytale')}
            data-on={newTheme === 'fairytale'}
            className="kid-seg flex items-center gap-1 px-3 py-2 text-xs"
          >
            <Castle size={13} /> 동화
          </button>
          <button type="submit" className="kid-btn flex items-center gap-1 px-4 py-2 text-sm">
            <Plus size={15} /> 추가
          </button>
        </div>
      </form>
    </div>
  );

  // ---- Top profile switch bar (always visible) ----
  const topBar = (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 relative z-20">
      <div className="kid-bar flex items-center gap-2 px-2.5 py-2 overflow-x-auto">
        <span className="shrink-0 pl-1.5 pr-0.5 kid-dim text-xs font-bold hidden sm:inline">누구예요?</span>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => switchTo(p.id)}
            data-on={p.id === active.id}
            className="kid-chip shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-sm"
          >
            {p.theme === 'space' ? <Rocket size={14} /> : <Castle size={14} />}
            {p.name}
          </button>
        ))}
        <span className="shrink-0 ml-auto pr-1 kid-dim text-[10px] hidden sm:flex items-center gap-1">
          <Lock size={10} /> 추가·삭제는 부모님 센터에서
        </span>
      </div>
    </div>
  );

  return (
    <>
      {topBar}
      {active.theme === 'space' ? (
        <SpaceApp key={active.id} ns={active.id} name={active.name} chrome={chrome} />
      ) : (
        <FairytaleApp key={active.id} ns={active.id} name={active.name} chrome={chrome} />
      )}
    </>
  );
}
