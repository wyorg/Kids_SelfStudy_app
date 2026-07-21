# 🚀 민건이의 오늘 우주 미션!

아이가 매일의 학습 미션을 스스로 체크하는 웹앱입니다.
React 19 + Vite 6 + Tailwind CSS v4 + Motion + canvas-confetti 기반.

## 방법 1. 그냥 바로 쓰기 (설치 필요 없음) ⭐ 추천

`민건이의-우주미션.html` 파일을 **더블클릭**하면 브라우저에서 바로 열립니다.
서버도, npm 설치도 필요 없습니다. 태블릿/노트북에 이 파일 하나만 복사해도 동작합니다.

> 기록(미션·스탬프·달력)은 그 브라우저의 LocalStorage에 저장됩니다.
> 즉 **같은 기기, 같은 브라우저**에서 열어야 이어서 쌓입니다.

## 방법 2. 개발 환경으로 실행하기

```bash
npm install
npm run dev      # http://localhost:3000
```

빌드 및 단일 HTML 파일 재생성:

```bash
npm run build        # dist/ 생성
npm run standalone   # 민건이의-우주미션.html 재생성
```

## 주요 기능

- **오늘의 미션 체크** — 카드를 누르면 완료 처리되고 로켓이 지구 → 달로 전진
- **우주 스탬프 정거장** — 하루 미션을 모두 끝내면 스탬프 1개 (최대 30개)
- **보상 축하 화면** — 전체 완료 시 컨페티 + 부모님이 설정한 보상 문구 표시
- **30개 달성 대형 축하** — 최종 선물 문구와 함께 특별 화면
- **부모님 관리 센터** — 덧셈 문제로 잠금 해제 후 미션 추가/삭제, 보상 문구 설정,
  스탬프 수동 조정, 최근 7일 성공 로그 확인
- **효과음** — Web Audio API로 합성한 전자음 (우측 상단에서 음소거 가능)

## 원본 사양 대비 수정한 부분

원본 `CLAUDE_CODE_EXPORTS.md`를 그대로 옮기면 빌드가 되지 않아 아래를 수정했습니다.

1. `package.json` — `"^18.2.0" || "^19.0.0"` 형태는 JSON 문법 오류라 단일 버전으로 정리
2. `package.json` — `vite.config.ts`가 import 하는 `@vitejs/plugin-react` 누락되어 추가
3. `vite.config.ts` — ESM 환경에서 쓸 수 없는 `__dirname`을 `import.meta.url` 기반으로 교체
4. `tsconfig.json` — 사양에 없었으나 `npm run build`(tsc)에 필요하여 추가
5. `src/App.tsx` — `restoreDefaultMissions()`에서 히스토리 저장 시 미션 배열을 넘기던 버그
   (`saveHistoryToStorage(INITIAL_MISSIONS)` → `saveHistoryToStorage(updatedHistory)`) 수정
