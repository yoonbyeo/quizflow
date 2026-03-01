# QuizFlow ⚡

스마트한 플래시카드 학습 앱 — Cloudflare Pages 배포용

## 기능

- **플래시카드** — 카드 뒤집기, 알아요/모르겠어요 평가, 셔플
- **테스트** — 객관식 + 주관식, 문제 수/방향 설정 가능
- **매칭 게임** — 용어-정의 짝 맞추기 (타이머 포함)
- **쓰기 연습** — 직접 입력 학습
- **학습 통계** — 정확도, 난이도 분포, 최근 학습 현황
- **로컬 스토리지** — 데이터 자동 저장 (서버 불필요)

## 로컬 실행

```bash
npm install
npm run dev
```

## Cloudflare Pages 배포

### 방법 1: Git 연동 (권장)

1. GitHub에 레포 push
2. [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create a project
3. GitHub 레포 연결
4. 빌드 설정:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Deploy!

### 방법 2: CLI 직접 배포

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name quizflow
```

## 기술 스택

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Zustand (상태 관리)
- React Router v7
- Lucide React (아이콘)
- Framer Motion (애니메이션)
