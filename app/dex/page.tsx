"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDexCollection, evolveInDex } from "@/lib/storage";
import type { DexCollection, DexEntry } from "@/lib/types";
import { TYPE_COLORS, TYPE_LABELS } from "@/lib/types";
import { getPokemonDisplayData, getSpriteUrl, getShinySpriteUrl } from "@/lib/pokemon-data";

type SortMode = "id" | "recent";
const TOTAL = 251;

export default function DexPage() {
  const [dex, setDex] = useState<DexCollection>([]);
  const [sort, setSort] = useState<SortMode>("id");

  useEffect(() => { setDex(getDexCollection()); }, []);

  const sorted = [...dex].sort((a, b) =>
    sort === "id" ? a.id - b.id : b.registeredAt.localeCompare(a.registeredAt)
  );
  const pct = Math.round((dex.length / TOTAL) * 100);

  function handleEvolve(entryId: number) {
    const evolved = evolveInDex(entryId);
    if (evolved) {
      setDex(getDexCollection());
    }
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-500 px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/pet" className="text-white text-2xl leading-none">←</Link>
          <h1 className="text-xl font-black text-white flex-1">포켓몬 도감</h1>
        </div>
        <div className="bg-white/15 rounded-2xl p-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">수집</p>
              <p className="text-4xl font-black text-white">
                {dex.length}<span className="text-xl font-bold text-white/60">/{TOTAL}</span>
              </p>
            </div>
            <p className="text-5xl font-black text-white/20">{pct}%</p>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-white/60 text-xs mt-2">{TOTAL - dex.length}마리 남음</p>
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        <div className="flex gap-2 mb-4 bg-white rounded-2xl p-1 shadow-sm">
          {(["id","recent"] as SortMode[]).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                sort === s ? "bg-red-500 text-white shadow-sm" : "text-gray-400"}`}>
              {s === "id" ? "번호순" : "최근순"}
            </button>
          ))}
        </div>

        {dex.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-3 gap-2.5">
            {sorted.map((entry) => (
              <DexCard key={entry.id} entry={entry} onEvolve={handleEvolve} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DexCard({ entry, onEvolve }: { entry: DexEntry; onEvolve: (id: number) => void }) {
  const currentId = entry.currentId ?? entry.id;
  const stage = entry.stage ?? 0;
  const currentData = getPokemonDisplayData(currentId);
  const canEvolve = !!(currentData?.evolvesTo) && stage < 2;
  const spriteUrl = entry.isShiny ? getShinySpriteUrl(currentId) : getSpriteUrl(currentId);
  const displayName = currentData?.name ?? entry.name;

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center gap-1.5 relative
      ${entry.isShiny ? "ring-2 ring-yellow-300" : ""}`}>

      {entry.isShiny && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-yellow-300 text-yellow-900 px-1 py-0.5 rounded-full">
          ✨
        </span>
      )}

      <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={spriteUrl} alt={displayName}
          className="w-12 h-12 object-contain"
          style={{ imageRendering: "pixelated" }} />
      </div>
      <p className="text-[10px] text-gray-400 font-mono">#{String(entry.id).padStart(3,"0")}</p>
      <p className="text-xs font-black text-gray-800 text-center leading-tight">{displayName}</p>
      <div className="flex flex-wrap gap-0.5 justify-center">
        {(currentData?.types ?? entry.types).map((t) => (
          <span key={t} className="text-[9px] text-white px-1.5 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: TYPE_COLORS[t] }}>{TYPE_LABELS[t]}</span>
        ))}
      </div>
      <p className="text-[9px] text-gray-300">{entry.registeredDate}</p>

      {canEvolve && (
        <button
          onClick={() => onEvolve(entry.id)}
          className="w-full mt-1 py-1 rounded-xl text-[10px] font-black text-white bg-purple-500 active:scale-95 transition-transform"
        >
          진화 ▶
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-6xl">📭</div>
      <p className="text-gray-500 font-bold">아직 포켓몬이 없어요!</p>
      <p className="text-sm text-gray-400 text-center">오늘의 미션을 완료하면 첫 포켓몬이 등록돼요.</p>
      <Link href="/pet" className="mt-2 px-6 py-3 bg-red-500 text-white font-black rounded-2xl shadow-md shadow-red-200">
        오늘 포켓몬 보러 가기
      </Link>
    </div>
  );
}
