"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDeckEntries,
  removeFromDeckStorage,
  evolveInDeck,
} from "@/lib/storage";
import {
  getPokemonDisplayData,
  getPokemonById,
  getSpriteUrl,
  EEVEE_EVOLUTIONS,
} from "@/lib/pokemon-data";
import { TYPE_COLORS } from "@/lib/types";
import type { DeckEntry, PokemonType } from "@/lib/types";

// ── 헬퍼: 진화 가능 여부 ──────────────────────────────────
function canEvolveFirst(entry: DeckEntry): boolean {
  if (entry.stage !== 0) return false;
  if (entry.level < 3 || entry.level >= 9) return false;
  const base = getPokemonById(entry.caughtId);
  if (!base) return false;
  return !!(base.isEevee || base.evolvesTo);
}

function canEvolveSecond(entry: DeckEntry): boolean {
  if (entry.stage !== 1) return false;
  if (entry.level < 9) return false;
  const current = getPokemonDisplayData(entry.currentId);
  return !!(current?.evolvesTo);
}

function getFirstEvoTarget(entry: DeckEntry): number | null {
  if (entry.eeveeEvoId) return entry.eeveeEvoId;
  const base = getPokemonById(entry.caughtId);
  if (!base) return null;
  if (base.isEevee) {
    // 랜덤 선택
    return EEVEE_EVOLUTIONS[Math.floor(Math.random() * EEVEE_EVOLUTIONS.length)];
  }
  return base.evolvesTo ?? null;
}

function getSecondEvoTarget(entry: DeckEntry): number | null {
  const current = getPokemonDisplayData(entry.currentId);
  return current?.evolvesTo ?? null;
}

// ── 진화 애니메이션 컴포넌트 ──────────────────────────────
type EvoPhase = "flash" | "white" | "appear" | "done";

function EvolutionAnimation({
  fromId,
  toId,
  toName,
  onDone,
}: {
  fromId: number;
  toId: number;
  toName: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<EvoPhase>("flash");

  const stableOnDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("white"),  700);
    const t2 = setTimeout(() => setPhase("appear"), 1400);
    const t3 = setTimeout(() => setPhase("done"),   3200);
    const t4 = setTimeout(stableOnDone,             3700);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [stableOnDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500
        ${phase === "done" ? "opacity-0" : "opacity-100"} bg-black/90`}
    >
      <div className="flex flex-col items-center gap-6">
        {phase === "flash" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getSpriteUrl(fromId)}
            alt=""
            className="w-36 h-36 object-contain evo-flash-out"
            style={{ imageRendering: "pixelated" }}
          />
        )}
        {phase === "white" && (
          <div
            className="w-36 h-36 rounded-full bg-white evo-white-pulse"
            style={{ boxShadow: "0 0 60px 40px white" }}
          />
        )}
        {(phase === "appear" || phase === "done") && (
          <>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSpriteUrl(toId)}
                alt={toName}
                className="w-36 h-36 object-contain evo-appear"
                style={{ imageRendering: "pixelated" }}
              />
              {["✨","⭐","✨","⭐","✨","⭐"].map((s, i) => (
                <span
                  key={i}
                  className="evo-star absolute text-xl pointer-events-none"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    left: `${50 + 90 * Math.cos((i / 6) * 2 * Math.PI)}%`,
                    top:  `${50 + 90 * Math.sin((i / 6) * 2 * Math.PI)}%`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="text-white font-black text-2xl text-center evo-text">
              {toName}으로<br />진화했다!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── 덱 슬롯 카드 ─────────────────────────────────────────
function DeckSlot({
  entry,
  onRelease,
  onEvolve,
}: {
  entry: DeckEntry;
  onRelease: (caughtId: number) => void;
  onEvolve: (entry: DeckEntry) => void;
}) {
  const displayData = getPokemonDisplayData(entry.currentId);
  if (!displayData) return null;

  const { name, nameEn: _nameEn, types } = displayData;
  const sprite = getSpriteUrl(entry.currentId);

  const evolveFirst = canEvolveFirst(entry);
  const evolveSecond = canEvolveSecond(entry);
  const canEvolve = evolveFirst || evolveSecond;

  const levelPct = (entry.level / 9) * 100;
  const levelColor =
    entry.level >= 7 ? "#ef4444" :
    entry.level >= 4 ? "#f59e0b" : "#22c55e";

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* 스프라이트 */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center
          rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sprite}
            alt={name}
            className="w-16 h-16 object-contain drop-shadow-sm"
            style={{ imageRendering: "pixelated" }}
          />
          {/* 진화 가능 표시 */}
          {canEvolve && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full
              flex items-center justify-center shadow text-xs animate-pulse">
              ✨
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-black text-gray-800 truncate">{name}</span>
          </div>
          <div className="flex gap-1 mb-2">
            {(types as PokemonType[]).map((t) => (
              <span
                key={t}
                className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold capitalize"
                style={{ backgroundColor: TYPE_COLORS[t] }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* 레벨 바 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 w-10 flex-shrink-0">
              Lv.{entry.level}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${levelPct}%`, backgroundColor: levelColor }}
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">/9</span>
          </div>

          {/* 단계 표시 */}
          <div className="mt-1 flex gap-1">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${entry.stage >= s ? "bg-yellow-400" : "bg-gray-200"}`}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">
              {entry.stage === 0 ? "기본형" : entry.stage === 1 ? "1차진화" : "최종형"}
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2 px-4 pb-4">
        {canEvolve && (
          <button
            onClick={() => onEvolve(entry)}
            className="flex-1 py-2 text-sm font-black text-white rounded-xl
              bg-gradient-to-r from-yellow-400 to-orange-400 shadow-sm active:scale-95 transition-transform"
          >
            ✨ 진화하기!
          </button>
        )}
        <button
          onClick={() => onRelease(entry.caughtId)}
          className={`py-2 text-sm font-bold rounded-xl border border-gray-200 text-gray-500
            active:scale-95 transition-transform ${canEvolve ? "px-4" : "flex-1"}`}
        >
          내보내기
        </button>
      </div>

      {/* 레벨 9 잠금 안내 */}
      {entry.stage === 0 && entry.level === 9 && (() => {
        const base = getPokemonById(entry.caughtId);
        return (base?.evolvesTo || base?.isEevee) ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 text-center">
              ⚠️ Lv.9 도달 — 진화 기회를 놓쳤어요
            </p>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ── 빈 슬롯 ──────────────────────────────────────────────
function EmptySlot({ slotNum }: { slotNum: number }) {
  return (
    <div className="bg-white/60 rounded-3xl border-2 border-dashed border-gray-200
      flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-2xl text-gray-300">+</span>
      </div>
      <p className="text-sm text-gray-400 font-medium">슬롯 {slotNum} 비어있음</p>
      <p className="text-xs text-gray-300">오늘의 포켓몬 페이지에서 추가하세요</p>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────
export default function DeckPage() {
  const [entries, setEntries] = useState<DeckEntry[]>([]);
  const [evoTarget, setEvoTarget] = useState<{
    entry: DeckEntry;
    toId: number;
    toName: string;
  } | null>(null);

  useEffect(() => {
    setEntries(getDeckEntries());
  }, []);

  function handleRelease(caughtId: number) {
    const updated = removeFromDeckStorage(caughtId);
    setEntries(updated);
  }

  function handleEvolve(entry: DeckEntry) {
    const isFirst = canEvolveFirst(entry);
    let toId: number | null = null;

    if (isFirst) {
      toId = getFirstEvoTarget(entry);
    } else if (canEvolveSecond(entry)) {
      toId = getSecondEvoTarget(entry);
    }

    if (!toId) return;

    const toData = getPokemonDisplayData(toId);
    setEvoTarget({
      entry,
      toId,
      toName: toData ? (toData.nameEn ?? toData.name) : `#${toId}`,
    });
  }

  const handleEvoDone = useCallback(() => {
    if (!evoTarget) return;
    const updated = evolveInDeck(evoTarget.entry.caughtId, evoTarget.toId);
    if (updated) {
      setEntries((prev) =>
        prev.map((e) => e.caughtId === updated.caughtId ? updated : e)
      );
    }
    setEvoTarget(null);
  }, [evoTarget]);

  // 3슬롯 배열 구성
  const slots: (DeckEntry | null)[] = [
    entries[0] ?? null,
    entries[1] ?? null,
    entries[2] ?? null,
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {evoTarget && (
        <EvolutionAnimation
          fromId={evoTarget.entry.currentId}
          toId={evoTarget.toId}
          toName={evoTarget.toName}
          onDone={handleEvoDone}
        />
      )}

      {/* 헤더 */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400">My Deck</p>
          <h1 className="text-2xl font-black text-gray-800">나의 덱</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {entries.length}/3마리 · 중복 포켓몬이 뜨면 자동 레벨업!
          </p>
        </div>
      </div>

      {/* 슬롯 목록 */}
      <div className="px-4 space-y-3 pb-6">
        {slots.map((entry, i) =>
          entry ? (
            <DeckSlot
              key={entry.caughtId}
              entry={entry}
              onRelease={handleRelease}
              onEvolve={handleEvolve}
            />
          ) : (
            <EmptySlot key={`empty-${i}`} slotNum={i + 1} />
          )
        )}
      </div>

      {/* 안내 */}
      <div className="mx-4 mb-4 p-4 bg-white/80 rounded-2xl">
        <p className="text-xs text-gray-400 leading-relaxed text-center">
          💡 Lv.3~8 사이에 진화 버튼을 누르세요<br />
          Lv.9에 도달하면 더 이상 레벨업이 안 돼요
        </p>
      </div>
    </main>
  );
}
