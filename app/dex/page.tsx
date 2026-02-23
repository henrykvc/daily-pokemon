"use client";

// ── Dex 페이지 (/dex) ──────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDexCollection } from "@/lib/storage";
import type { DexCollection, DexEntry } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";

type SortMode = "id" | "recent";

const TOTAL = 151; // 1세대 기준 (전체 251 로 변경 가능)

export default function DexPage() {
  const [dex, setDex] = useState<DexCollection>([]);
  const [sort, setSort] = useState<SortMode>("id");

  useEffect(() => {
    setDex(getDexCollection());
  }, []);

  const sorted = [...dex].sort((a, b) =>
    sort === "id" ? a.id - b.id : b.registeredAt.localeCompare(a.registeredAt)
  );

  const pct = Math.round((dex.length / TOTAL) * 100);

  return (
    <main className="flex-1 p-4 pb-8">
      {/* 헤더 */}
      <nav className="flex items-center gap-3 py-3 mb-4">
        <Link
          href="/pet"
          className="text-2xl leading-none"
          aria-label="뒤로"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">📖 내 도감</h1>
      </nav>

      {/* 통계 카드 */}
      <div className="bg-red-500 text-white rounded-3xl p-5 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-sm opacity-80">수집한 포켓몬</p>
            <p className="text-4xl font-bold">
              {dex.length}
              <span className="text-xl font-normal opacity-70">/{TOTAL}</span>
            </p>
          </div>
          <p className="text-5xl font-bold opacity-20">{pct}%</p>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 정렬 토글 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSort("id")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            sort === "id"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          도감번호순
        </button>
        <button
          onClick={() => setSort("recent")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            sort === "recent"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          최근 등록순
        </button>
      </div>

      {/* 도감 그리드 */}
      {dex.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {sorted.map((entry) => (
            <DexCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}

function DexCard({ entry }: { entry: DexEntry }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center gap-1">
      {/* 픽셀 이미지 placeholder */}
      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
        <span className="text-3xl select-none">{getPokeEmoji(entry.id)}</span>
      </div>

      <p className="text-[10px] text-gray-400 font-mono">
        #{String(entry.id).padStart(3, "0")}
      </p>
      <p className="text-xs font-bold text-gray-800 text-center leading-tight">
        {entry.name}
      </p>

      {/* 타입 뱃지 */}
      <div className="flex flex-wrap gap-0.5 justify-center">
        {entry.types.map((t) => (
          <span
            key={t}
            className="text-[9px] text-white px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[t] }}
          >
            {t}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        {entry.registeredDate}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="text-6xl">📭</div>
      <p className="text-gray-500 font-medium">아직 등록된 포켓몬이 없어요</p>
      <p className="text-sm text-gray-400">
        오늘의 미션을 완료하면 포켓몬이 등록됩니다!
      </p>
      <Link
        href="/pet"
        className="mt-2 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl"
      >
        오늘의 포켓몬 보러가기
      </Link>
    </div>
  );
}

// 임시 이모지 매핑 (실제 이미지 대체)
function getPokeEmoji(id: number): string {
  const map: Record<number, string> = {
    1:"🌱",4:"🔥",6:"🐉",7:"💧",25:"⚡",39:"🎵",
    52:"🐱",54:"💛",63:"🔮",79:"🌸",94:"👻",
    113:"🥚",116:"🌊",131:"🧊",133:"⭐",143:"😴",
    152:"🌿",155:"🌋",158:"💦",175:"🥚",196:"🔮",
    197:"🌙",245:"💙",249:"🌊",
  };
  return map[id] ?? "🎮";
}
