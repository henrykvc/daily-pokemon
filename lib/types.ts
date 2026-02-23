// ─────────────────────────────────────────
// A) TypeScript 타입 정의 + LocalStorage 스키마
// ─────────────────────────────────────────

// ── 포켓몬 원본 데이터 ──
export type PokemonType =
  | "normal" | "fire" | "water" | "grass" | "electric" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel";

export type Mood = "calm" | "normal" | "excited" | "annoyed" | "sad";

export type StyleTag =
  | "minimal" | "street" | "casual" | "formal" | "girly"
  | "sporty" | "vintage" | "dandy" | "techwear" | "amekaji";

export interface PokemonData {
  id: number;                      // 도감번호 1~251
  name: string;                    // 한글 이름
  nameEn: string;                  // 영문 이름
  types: PokemonType[];            // 1~2개 타입
  colorAffinity: {
    main: string[];                // 어울리는 주 색 키워드 (e.g. "red", "orange")
    sub: string[];                 // 어울리는 서브 색 키워드
  };
  moodAffinity: Mood[];            // 어울리는 기분
  styleTags: StyleTag[];           // 어울리는 스타일 태그
  rarity?: 1 | 2 | 3;             // 1=일반, 2=레어, 3=전설급
  description: string;            // 말풍선용 짧은 문구
}

// ── 사용자 입력 ──
export interface UserInput {
  mainColor: string;               // hex (e.g. "#FF6B6B")
  subColor: string;                // hex
  mood: Mood;
  moodText?: string;               // 선택적 한 줄 텍스트
  styleTags: StyleTag[];
}

// ── 미션 ──
export interface Mission {
  text: string;
  done: boolean;
}

// ── 추천 결과 ──
export interface PokemonResult {
  id: number;
  name: string;
  nameEn: string;
  types: PokemonType[];
  assetPath: string;               // e.g. /assets/pokemon/1.png
  description: string;
}

// ── 하루 상태 (LocalStorage: dailyState:{YYYY-MM-DD}) ──
export interface DailyState {
  date: string;                    // "YYYY-MM-DD"
  input: UserInput;
  missions: Mission[];             // 항상 3개
  pokemonResult: PokemonResult;
  isAllMissionsDone: boolean;
  isAddedToDex: boolean;
}

// ── 도감 항목 (LocalStorage: dexCollection) ──
export interface DexEntry {
  id: number;
  name: string;
  nameEn: string;
  types: PokemonType[];
  assetPath: string;
  registeredAt: string;            // ISO 날짜 문자열
  registeredDate: string;         // "YYYY-MM-DD"
}

// ── 도감 전체 ──
export type DexCollection = DexEntry[];

// ── LocalStorage 키 헬퍼 ──
export const STORAGE_KEYS = {
  dailyState: (date: string) => `dailyState:${date}`,
  dexCollection: "dexCollection",
  userPrefs: "userPrefs",
} as const;

// ── 기분 레이블 ──
export const MOOD_LABELS: Record<Mood, string> = {
  calm: "😌 차분",
  normal: "😐 보통",
  excited: "🤩 신남",
  annoyed: "😤 짜증",
  sad: "😢 우울",
};

// ── 스타일 태그 레이블 ──
export const STYLE_TAG_LABELS: Record<StyleTag, string> = {
  minimal: "미니멀",
  street: "스트릿",
  casual: "캐주얼",
  formal: "포멀",
  girly: "걸리시",
  sporty: "스포티",
  vintage: "빈티지",
  dandy: "댄디",
  techwear: "테크웨어",
  amekaji: "아메카지",
};

// ── 타입 색상 매핑 (UI 뱃지용) ──
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
};
