// ─────────────────────────────────────────
// LocalStorage 유틸리티
// ─────────────────────────────────────────
import type {
  DailyState,
  DexCollection,
  DexEntry,
  DeckEntry,
  PokemonResult,
} from "./types";
import { STORAGE_KEYS } from "./types";

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
  date: string
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
  };

  const updated = [...dex, entry];
  safeSet(STORAGE_KEYS.dexCollection, updated);
  return updated;
}

export function getCollectedIds(): Set<number> {
  const dex = getDexCollection();
  return new Set(dex.map((e) => e.id));
}

// ── DeckEntries ────────────────────────────────────────────
export function getDeckEntries(): DeckEntry[] {
  return safeGet<DeckEntry[]>(STORAGE_KEYS.deckEntries) ?? [];
}

export function saveDeckEntries(entries: DeckEntry[]): void {
  safeSet(STORAGE_KEYS.deckEntries, entries);
}

export function addToDeckStorage(entry: DeckEntry): DeckEntry[] {
  const entries = getDeckEntries();
  if (entries.length >= 3) return entries;
  const updated = [...entries, entry];
  safeSet(STORAGE_KEYS.deckEntries, updated);
  return updated;
}

export function removeFromDeckStorage(caughtId: number): DeckEntry[] {
  const entries = getDeckEntries().filter((e) => e.caughtId !== caughtId);
  safeSet(STORAGE_KEYS.deckEntries, entries);
  return entries;
}

export function levelUpInDeck(caughtId: number): DeckEntry | null {
  const entries = getDeckEntries();
  const idx = entries.findIndex((e) => e.caughtId === caughtId);
  if (idx < 0) return null;
  const entry = entries[idx];
  if (entry.level >= 9) return null;
  entries[idx] = { ...entry, level: entry.level + 1 };
  safeSet(STORAGE_KEYS.deckEntries, entries);
  return entries[idx];
}

export function evolveInDeck(caughtId: number, newId: number): DeckEntry | null {
  const entries = getDeckEntries();
  const idx = entries.findIndex((e) => e.caughtId === caughtId);
  if (idx < 0) return null;
  const entry = entries[idx];
  entries[idx] = { ...entry, currentId: newId, stage: entry.stage + 1 };
  safeSet(STORAGE_KEYS.deckEntries, entries);
  return entries[idx];
}

export function markLeveledUpToday(date: string): DailyState | null {
  const state = getDailyState(date);
  if (!state) return null;
  state.isLeveledUpToday = true;
  setDailyState(state);
  return state;
}
