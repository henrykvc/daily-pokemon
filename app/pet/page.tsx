"use client";

// ── Pet 페이지 (/pet) ──────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSeoulDateString, formatDisplayDate } from "@/lib/date";
import {
  getDailyState,
  updateDailyMission,
  addToDex,
  markAddedToDex,
} from "@/lib/storage";
import type { DailyState } from "@/lib/types";
import { TYPE_COLORS, MOOD_LABELS } from "@/lib/types";
import ShareCard from "@/components/ShareCard";

export default function PetPage() {
  const router = useRouter();
  const today = getSeoulDateString();

  const [state, setState] = useState<DailyState | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const [showFirework, setShowFirework] = useState(false);
  const [shareMode, setShareMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getDailyState(today);
    if (!s) {
      router.replace("/");
      return;
    }
    setState(s);
    // 이미 도감 등록 완료 상태면 도장 표시
    if (s.isAddedToDex) setShowStamp(true);
  }, [today, router]);

  function handleMissionToggle(index: number) {
    if (!state || state.isAddedToDex) return;
    const updated = updateDailyMission(today, index, !state.missions[index].done);
    if (!updated) return;
    setState({ ...updated });

    // 전체 완료 시 도감 등록
    if (updated.isAllMissionsDone && !updated.isAddedToDex) {
      setTimeout(() => {
        addToDex(updated.pokemonResult, today);
        markAddedToDex(today);
        setState((prev) => prev ? { ...prev, isAddedToDex: true } : prev);
        setShowStamp(true);
        setShowFirework(true);
        setTimeout(() => setShowFirework(false), 2000);
      }, 400);
    }
  }

  if (!state) return <LoadingScreen />;

  const { pokemonResult, missions, input, isAddedToDex } = state;
  const completedCount = missions.filter((m) => m.done).length;

  return (
    <main className="flex-1 p-4 pb-8 relative">
      {/* 폭죽 이모지 */}
      {showFirework && <FireworkEffect />}

      {/* 상단 네비 */}
      <nav className="flex items-center justify-between py-3 mb-2">
        <span className="text-sm text-gray-500">{formatDisplayDate(today)}</span>
        <Link
          href="/dex"
          className="text-sm font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
        >
          📖 내 도감
        </Link>
      </nav>

      {/* 포켓몬 카드 */}
      <div
        ref={cardRef}
        className="bg-white rounded-3xl shadow-md p-5 mb-5 relative overflow-hidden"
      >
        {/* 색상 배경 띠 */}
        <div
          className="absolute top-0 left-0 right-0 h-24 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${input.mainColor}, ${input.subColor})`,
          }}
        />

        {/* 도장 */}
        {showStamp && (
          <div className="absolute top-3 right-3 z-10 stamp-anim">
            <div className="border-4 border-red-500 text-red-500 font-bold text-xs px-2 py-1 rounded rotate-[-12deg] opacity-90">
              도감 등록 완료!
            </div>
          </div>
        )}

        <div className="relative z-0">
          {/* 포켓몬 이미지 placeholder */}
          <div className="flex justify-center mb-3">
            <div className="poke-bounce">
              <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                {/* 실제 구현시 <Image src={pokemonResult.assetPath} ...> */}
                <span className="text-5xl select-none">
                  {getPokeEmoji(pokemonResult.id)}
                </span>
                <p className="absolute bottom-1 text-[9px] text-gray-400">
                  #{String(pokemonResult.id).padStart(3, "0")}
                </p>
              </div>
            </div>
          </div>

          {/* 이름 & 타입 */}
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{pokemonResult.name}</h2>
            <p className="text-xs text-gray-400 mb-2">{pokemonResult.nameEn}</p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {pokemonResult.types.map((t) => (
                <span
                  key={t}
                  className="text-xs text-white px-2.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: TYPE_COLORS[t] }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 말풍선 */}
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              💬 {pokemonResult.description}
            </p>
          </div>

          {/* 입력 요약 */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: input.mainColor }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: input.subColor }}
            />
            <span>{MOOD_LABELS[input.mood]}</span>
            <span>·</span>
            <span>{input.styleTags.join(", ")}</span>
          </div>
        </div>
      </div>

      {/* 미션 체크리스트 */}
      <div className="bg-white rounded-3xl shadow-md p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">오늘의 미션</h3>
          <span className="text-sm text-gray-500">
            {completedCount}/3 완료
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-red-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {missions.map((mission, i) => (
            <button
              key={i}
              onClick={() => handleMissionToggle(i)}
              disabled={isAddedToDex}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                mission.done ? "bg-green-50" : "bg-gray-50"
              } ${isAddedToDex ? "cursor-default" : "active:scale-[0.98]"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                  mission.done
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {mission.done && <span className="text-xs">✓</span>}
              </div>
              <span
                className={`text-sm font-medium ${
                  mission.done ? "line-through text-gray-400" : "text-gray-700"
                }`}
              >
                {mission.text}
              </span>
            </button>
          ))}
        </div>

        {isAddedToDex && (
          <p className="text-center text-sm text-green-600 font-medium mt-4">
            🎉 모든 미션 완료! 도감에 등록되었어요.
          </p>
        )}
      </div>

      {/* 공유 버튼 */}
      <button
        onClick={() => setShareMode(true)}
        className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl text-base active:scale-95 transition-transform"
      >
        📸 오늘의 카드 저장하기
      </button>

      {/* 공유 카드 모달 */}
      {shareMode && (
        <ShareCard
          state={state}
          onClose={() => setShareMode(false)}
        />
      )}
    </main>
  );
}

// ── 임시 포켓몬 이모지 (실제 픽셀 이미지 대체) ──
function getPokeEmoji(id: number): string {
  const map: Record<number, string> = {
    1:"🌱", 4:"🔥", 6:"🐉", 7:"💧", 25:"⚡", 39:"🎵",
    52:"🐱", 54:"💛", 63:"🔮", 79:"🌸", 94:"👻",
    113:"🥚", 116:"🌊", 131:"🧊", 133:"⭐", 143:"😴",
    152:"🌿", 155:"🌋", 158:"💦", 175:"🥚", 196:"🔮",
    197:"🌙", 245:"💙", 249:"🌊",
  };
  return map[id] ?? "🎮";
}

function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-bounce">🎮</div>
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    </div>
  );
}

function FireworkEffect() {
  const emojis = ["🎉","✨","🌟","💥","🎊"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative w-64 h-64">
        {emojis.map((e, i) => (
          <span
            key={i}
            className="absolute text-4xl firework-emoji"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
