// ─────────────────────────────────────────
// C) 추천 알고리즘 (룰 기반 + daily seed)
// ─────────────────────────────────────────
import type { PokemonData, UserInput, Mood, StyleTag } from "./types";
import { POKEMON_DATA } from "./pokemon-data";

// ── 색 이름 분류 헬퍼 (hex → 색 키워드) ──────────────────
interface ColorRange {
  keys: string[];
  hMin: number;
  hMax: number;
  sMin?: number;
  lMin?: number;
  lMax?: number;
}

const COLOR_RANGES: ColorRange[] = [
  { keys: ["red", "crimson"],       hMin: 345, hMax: 360 },
  { keys: ["red", "crimson"],       hMin: 0,   hMax: 15  },
  { keys: ["orange", "flame"],      hMin: 15,  hMax: 40  },
  { keys: ["yellow", "gold", "lemon", "amber"], hMin: 40, hMax: 65 },
  { keys: ["lime", "green"],        hMin: 65,  hMax: 100 },
  { keys: ["green", "sage", "teal", "olive"],   hMin: 100, hMax: 165 },
  { keys: ["teal", "cyan", "aqua", "crystal"],  hMin: 165, hMax: 195 },
  { keys: ["sky", "blue", "cerulean", "aqua"],  hMin: 195, hMax: 235 },
  { keys: ["blue", "navy", "indigo"],           hMin: 235, hMax: 255 },
  { keys: ["indigo", "purple", "violet"],       hMin: 255, hMax: 285 },
  { keys: ["purple", "lavender", "violet"],     hMin: 285, hMax: 325 },
  { keys: ["pink", "rose", "blush"],            hMin: 325, hMax: 345 },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hexToColorKeys(hex: string): string[] {
  if (!hex || !hex.startsWith("#")) return [];
  try {
    const [h, s, l] = hexToHsl(hex);
    // 무채색 처리
    if (s < 10) {
      if (l > 85) return ["white", "pearl", "silver", "cream"];
      if (l < 20) return ["black", "dark", "charcoal"];
      return ["silver", "slate", "gray"];
    }
    if (l < 20) return ["dark", "black", "navy"];
    if (l > 85) return ["white", "cream", "pearl", "light"];

    const matched = COLOR_RANGES.filter((r) => {
      if (r.hMax < r.hMin) return h >= r.hMin || h <= r.hMax; // wrap-around (red)
      return h >= r.hMin && h < r.hMax;
    });
    const keys = matched.flatMap((r) => r.keys);
    // 밝기 보정
    if (l < 35) keys.push("dark", "navy", "charcoal");
    if (l > 70) keys.push("light", "cream", "pale");
    if (s > 80) keys.push("vivid", "bright");
    return [...new Set(keys)];
  } catch {
    return [];
  }
}

// ── Daily Seed (Mulberry32 PRNG) ────────────────────────
function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDailyRng(date: string): () => number {
  return mulberry32(strHash(date));
}

// ── 점수 계산 ─────────────────────────────────────────────
const SCORE_WEIGHTS = {
  mainColor: 5,
  subColor: 3,
  mood: 4,
  styleTag: 2,  // 매칭 태그 1개당
  rarity: 0.5,  // 레어도 역가중치 (희귀할수록 약간 불리 → 다양성 확보)
};

function scorePokemon(
  pokemon: PokemonData,
  input: UserInput,
  mainKeys: string[],
  subKeys: string[],
  noise: number
): number {
  let score = 0;

  // 메인 색 매칭
  const mainHit = pokemon.colorAffinity.main.some((c) =>
    mainKeys.includes(c)
  );
  if (mainHit) score += SCORE_WEIGHTS.mainColor;

  // 서브 색 매칭
  const subHit = pokemon.colorAffinity.sub.some((c) => subKeys.includes(c));
  if (subHit) score += SCORE_WEIGHTS.subColor;

  // 기분 매칭
  if (pokemon.moodAffinity.includes(input.mood as Mood)) {
    score += SCORE_WEIGHTS.mood;
  }

  // 스타일 태그 교집합
  const styleMatch = pokemon.styleTags.filter((t) =>
    input.styleTags.includes(t as StyleTag)
  ).length;
  score += styleMatch * SCORE_WEIGHTS.styleTag;

  // 레어도 역가중치
  const rarity = pokemon.rarity ?? 1;
  score -= (rarity - 1) * SCORE_WEIGHTS.rarity;

  // seed 기반 미세 노이즈 (동점 처리)
  score += noise * 0.1;

  return score;
}

// ── 메인 추천 함수 ────────────────────────────────────────
export interface RecommendResult {
  pokemon: PokemonData | null;
  isComplete: boolean; // 도감 251마리 전부 채운 경우
}

export function recommendPokemon(
  input: UserInput,
  collectedIds: Set<number>,
  date: string
): RecommendResult {
  const rng = createDailyRng(date);

  const candidates = POKEMON_DATA.filter((p) => !collectedIds.has(p.id));

  if (candidates.length === 0) {
    return { pokemon: null, isComplete: true };
  }

  const mainKeys = hexToColorKeys(input.mainColor);
  const subKeys = hexToColorKeys(input.subColor);

  const scored = candidates.map((p) => ({
    pokemon: p,
    score: scorePokemon(p, input, mainKeys, subKeys, rng()),
  }));

  scored.sort((a, b) => b.score - a.score);

  return { pokemon: scored[0].pokemon, isComplete: false };
}
