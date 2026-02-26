// ─────────────────────────────────────────
// LocalStorage 유틸리티
// ─────────────────────────────────────────
import type {
  DailyState,
  DexCollection,
  DexEntry,
  PokemonResult,
} from "./types";
import { STORAGE_KEYS } from "./types";
import { getPokemonDisplayData, getSpriteUrl, EEVEE_EVOLUTIONS } from "./pokemon-data";

// ── 안전한 JSON 파싱 ──
function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error("LocalStorage write failed:", key);
  }
}

// ── DailyState ──────────────────────────────────────────
export function getDailyState(date: string): DailyState | null {
  return safeGet<DailyState>(STORAGE_KEYS.dailyState(date));
}

export function setDailyState(state: DailyState): void {
  safeSet(STORAGE_KEYS.dailyState(state.date), state);
}

export function updateDailyMission(
  date: string,
  missionIndex: number,
  done: boolean
): DailyState | null {
  const state = getDailyState(date);
  if (!state) return null;

  state.missions[missionIndex].done = done;
  state.isAllMissionsDone = state.missions.every((m) => m.done);
  setDailyState(state);
  return state;
}

export function markAddedToDex(date: string): DailyState | null {
  const state = getDailyState(date);
  if (!state) return null;

  state.isAddedToDex = true;
  setDailyState(state);
  return state;
}

// ── DexCollection ────────────────────────────────────────
export function getDexCollection(): DexCollection {
  return safeGet<DexCollection>(STORAGE_KEYS.dexCollection) ?? [];
}

export function addToDex(
  pokemon: PokemonResult,
  date: string,
  isShiny?: boolean
): DexCollection {
  const dex = getDexCollection();

  // 중복 방지
  const alreadyExists = dex.some((e) => e.id === pokemon.id);
  if (alreadyExists) return dex;

  const entry: DexEntry = {
    id: pokemon.id,
    name: pokemon.name,
    nameEn: pokemon.nameEn,
    types: pokemon.types,
    assetPath: pokemon.assetPath,
    registeredAt: new Date().toISOString(),
    registeredDate: date,
    stage: 0,
    currentId: pokemon.id,
    isShiny: isShiny ?? false,
  };

  const updated = [...dex, entry];
  safeSet(STORAGE_KEYS.dexCollection, updated);
  return updated;
}

export function getCollectedIds(): Set<number> {
  const dex = getDexCollection();
  return new Set(dex.map((e) => e.id));
}

// ── 도감 진화 ────────────────────────────────────────────
export function evolveInDex(dexEntryId: number): DexEntry | null {
  const dex = getDexCollection();
  const idx = dex.findIndex((e) => e.id === dexEntryId);
  if (idx < 0) return null;

  const entry = dex[idx];
  const currentId = entry.currentId ?? entry.id;
  const stage = entry.stage ?? 0;
  if (stage >= 2) return null;

  const currentData = getPokemonDisplayData(currentId);
  if (!currentData) return null;

  let nextId: number | null = null;
  let eeveeEvoId = entry.eeveeEvoId;

  // 이브이 처리
  if (currentData.evolvesTo === undefined && currentId === 133) {
    // 이브이 1차 진화: 랜덤 선택 (아직 선택 안 된 경우)
    if (!eeveeEvoId) {
      eeveeEvoId = EEVEE_EVOLUTIONS[Math.floor(Math.random() * EEVEE_EVOLUTIONS.length)];
    }
    nextId = eeveeEvoId;
  } else {
    nextId = currentData.evolvesTo ?? null;
  }

  if (!nextId) return null;

  const nextData = getPokemonDisplayData(nextId);
  const newAssetPath = getSpriteUrl(nextId);

  dex[idx] = {
    ...entry,
    currentId: nextId,
    stage: stage + 1,
    assetPath: newAssetPath,
    name: nextData?.name ?? entry.name,
    eeveeEvoId,
  };

  safeSet(STORAGE_KEYS.dexCollection, dex);
  return dex[idx];
}

// ── 이로치 / 연속 미션 스트릭 ──────────────────────────
interface StreakData {
  lastCompletedDate: string;
  count: number;
}

export function getStreakData(): StreakData {
  return safeGet<StreakData>(STORAGE_KEYS.streakData) ?? { lastCompletedDate: "", count: 0 };
}

export function onMissionsAllComplete(date: string): boolean {
  const streak = getStreakData();

  // 어제 날짜 계산
  const today = new Date(date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newCount: number;
  if (streak.lastCompletedDate === yesterdayStr) {
    newCount = streak.count + 1;
  } else if (streak.lastCompletedDate === date) {
    // 이미 오늘 기록됨
    return streak.count >= 7;
  } else {
    newCount = 1;
  }

  const isShiny = newCount >= 7;
  if (isShiny) newCount = 0; // 7일 달성 시 리셋

  safeSet(STORAGE_KEYS.streakData, { lastCompletedDate: date, count: newCount });

  if (isShiny) {
    const state = getDailyState(date);
    if (state) {
      state.isShiny = true;
      setDailyState(state);
    }
  }

  return isShiny;
}
