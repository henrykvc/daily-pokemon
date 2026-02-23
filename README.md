# 오늘의 포켓몬 (Daily Pokémon) — MVP

## 프로젝트 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## 폴더 구조

```
daily-pokemon/
├── app/
│   ├── layout.tsx            # 루트 레이아웃 (max-w-480, 폰트)
│   ├── globals.css           # Tailwind + 커스텀 애니메이션
│   ├── page.tsx              # Setup 페이지 (/)
│   ├── pet/page.tsx          # Pet 페이지 (/pet)
│   ├── dex/page.tsx          # Dex 페이지 (/dex)
│   └── complete/page.tsx     # 도감 완성 축하 (/complete)
├── components/
│   └── ShareCard.tsx         # 공유 카드 모달
├── lib/
│   ├── types.ts              # A) 타입 정의 + LocalStorage 스키마
│   ├── pokemon-data.ts       # B) 포켓몬 데이터 (1세대 샘플)
│   ├── recommend.ts          # C) 추천 알고리즘 + seed
│   ├── storage.ts            # LocalStorage 유틸
│   └── date.ts               # Asia/Seoul 날짜
└── public/
    └── assets/pokemon/       # {id}.png 픽셀 스프라이트 (직접 배치)
```

---

## E) 상태 전이 흐름

```
앱 진입
  │
  ├─ 오늘 dailyState 있음? ──YES──→ /pet
  │
  NO
  │
  ▼
/ (Setup)
  Step1: 색상 선택
  Step2: 기분 선택
  Step3: 스타일 태그
  Step4: 미션 3개 입력
  │
  [제출]
  │
  ├─ 후보 포켓몬 = 0? ──YES──→ /complete (도감 완성 축하)
  │
  NO
  │
  추천 알고리즘 실행 (seed 고정, 재추첨 불가)
  dailyState 저장 (LocalStorage)
  │
  ▼
/pet (Pet)
  포켓몬 카드 표시
  미션 체크리스트 (체크만 가능)
  │
  모든 미션 완료?
  │
  YES
  │
  └─→ dexCollection에 포켓몬 추가
      isAddedToDex = true
      도장 애니메이션 + 🎉 폭죽 (2초 후 자동 제거)
  │
  [내 도감 버튼]
  │
  ▼
/dex (Dex)
  등록된 포켓몬 그리드 (도감번호순/최근순)
  수집 통계 (N/151, %)
  ← 뒤로 → /pet
```

---

## F) MVP 구현 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | Next.js App Router 프로젝트 셋업 (TS + Tailwind) | ✅ |
| 2 | TypeScript 타입 정의 + LocalStorage 스키마 | ✅ |
| 3 | 포켓몬 데이터 JSON (1세대 샘플 25마리) | ✅ |
| 4 | 색상 → 키워드 변환 (HEX→HSL→색계열) | ✅ |
| 5 | 룰 기반 추천 알고리즘 + Mulberry32 seed | ✅ |
| 6 | Setup 페이지 (4-step 입력 UX) | ✅ |
| 7 | Pet 페이지 (포켓몬 카드 + 미션 체크리스트) | ✅ |
| 8 | 도장 애니메이션 + 🎉 폭죽 이펙트 | ✅ |
| 9 | Dex 페이지 (그리드 + 정렬 + 통계) | ✅ |
| 10 | 공유 카드 (html-to-image PNG 저장) | ✅ |

### 추가 구현 필요 항목
- [ ] 1세대 151마리 전체 데이터 입력 (`lib/pokemon-data.ts` 확장)
- [ ] `/public/assets/pokemon/{id}.png` 픽셀 스프라이트 배치
- [ ] 날짜 변경 감지 (자정 후 Setup으로 리다이렉트)
- [ ] `next-pwa` 설정으로 PWA 전환
- [ ] 접근성(aria) 레이블 보완

---

## G) 향후 확장 아이디어 10개

| # | 아이디어 | 설명 |
|---|----------|------|
| 1 | **소셜 로그인 + 도감 동기화** | Google/Kakao 로그인 후 Supabase에 도감 저장. 기기 변경 시에도 유지 |
| 2 | **친구 비교 / 교환** | 친구 링크 공유 → 서로 도감 비교, 중복 포켓몬 교환 투표 |
| 3 | **컬러 히스토리 분석** | 30일 치 mainColor 히트맵 → "당신의 이번 달 컬러는 🔵 블루 계열" |
| 4 | **오늘의 테마 (날씨 연동)** | Open-Meteo API로 날씨 불러와 날씨별 포켓몬 보정 점수 (+) |
| 5 | **진화 시스템** | 동일 라인 포켓몬 연속 등록 시 진화 형태 해금 (예: 이상해씨→이상해풀) |
| 6 | **미션 템플릿 추천** | AI(Claude)가 기분·스타일 기반으로 미션 3개 자동 제안 |
| 7 | **주간/월간 리포트** | 7일 완료율, 감정 패턴 차트, 수집 속도 그래프 |
| 8 | **포켓몬 별명 짓기** | 도감 등록 시 포켓몬에 별명 부여, 카드에 표시 |
| 9 | **스트릭(연속 달성) 시스템** | N일 연속 미션 완료 시 배지 + 특별 포켓몬 출현 확률 ↑ |
| 10 | **커뮤니티 피드** | 오늘의 카드 공개 피드 → 좋아요/댓글, 포켓몬 인기 랭킹 |

---

## 포켓몬 데이터 확장 가이드

`lib/pokemon-data.ts`의 `POKEMON_DATA` 배열에 아래 형식으로 추가:

```typescript
{
  id: 2,           // 도감번호
  name: "이상해풀",
  nameEn: "Ivysaur",
  types: ["grass", "poison"],
  colorAffinity: {
    main: ["green", "teal"],
    sub: ["purple", "blue"],
  },
  moodAffinity: ["calm", "normal"],
  styleTags: ["minimal", "casual"],
  rarity: 1,
  description: "꽃봉오리가 피어나듯, 오늘 나도 성장하는 하루!",
}
```

### colorAffinity 색 키워드 목록
`red` `orange` `flame` `yellow` `gold` `lemon` `amber`
`lime` `green` `sage` `olive` `teal` `cyan` `aqua` `crystal`
`sky` `blue` `cerulean` `navy` `indigo` `purple` `violet`
`lavender` `pink` `rose` `blush` `white` `cream` `pearl`
`beige` `brown` `black` `dark` `charcoal` `silver` `slate`

---

## 저작권 안내

- 포켓몬 픽셀 스프라이트는 이 저장소에 포함되어 있지 않습니다.
- `/public/assets/pokemon/` 에 직접 합법적으로 취득한 스프라이트를 배치하세요.
- 포켓몬 이름/번호/타입 등 텍스트 데이터는 정보 목적으로 사용합니다.
