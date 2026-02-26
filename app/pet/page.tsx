"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSeoulDateString } from "@/lib/date";
import {
  getDailyState,
  updateDailyMission,
  addToDex,
  markAddedToDex,
  onMissionsAllComplete,
  getDexCollection,
} from "@/lib/storage";
import type { DailyState } from "@/lib/types";
import { TYPE_COLORS, TYPE_LABELS, MOOD_LABELS } from "@/lib/types";
import { getSpriteUrl, getShinySpriteUrl, ALL_POKEMON_IDS, getPokemonDisplayData } from "@/lib/pokemon-data";
import ShareCard from "@/components/ShareCard";
import {
  getUserId,
  getShareUrl,
  recordVisit,
  getUnclaimedBonusCount,
  claimOneBonus,
} from "@/lib/referral";

function hexAlpha(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(239,68,68,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function PokeBallSVG({ size = 60, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      className={spinning ? "pokeball-spin" : ""}>
      <path d="M 8,50 A 42,42 0 0 1 92,50 Z" fill="#FF1111" />
      <path d="M 8,50 A 42,42 0 0 0 92,50 Z" fill="#ffffff" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="5" />
      <line x1="8" y1="50" x2="92" y2="50" stroke="#1a1a1a" strokeWidth="5" />
      <circle cx="50" cy="50" r="13" fill="white" stroke="#1a1a1a" strokeWidth="5" />
      <circle cx="50" cy="50" r="6" fill="#eeeeee" />
    </svg>
  );
}

type CatchPhase = "shrink" | "drop" | "shake" | "caught" | "out";

function CatchAnimation({ src, name, onDone }: { src: string; name: string; onDone: () => void }) {
  const [phase, setPhase] = useState<CatchPhase>("shrink");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("drop"),    800);
    const t2 = setTimeout(() => setPhase("shake"),  1500);
    const t3 = setTimeout(() => setPhase("caught"), 3300);
    const t4 = setTimeout(() => setPhase("out"),    3900);
    const t5 = setTimeout(onDone,                   4500);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500
      ${phase === "out" ? "opacity-0" : "opacity-100"} bg-black/80`}>
      <div className="flex flex-col items-center gap-8">
        {phase === "shrink" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name}
            className="w-36 h-36 object-contain catch-pokemon-shrink"
            style={{ imageRendering: "pixelated" }} />
        )}
        {phase === "drop" && (
          <div className="catch-ball-drop"><PokeBallSVG size={96} /></div>
        )}
        {phase === "shake" && (
          <div className="catch-ball-shake"><PokeBallSVG size={96} /></div>
        )}
        {phase === "caught" && (
          <>
            <div className="relative" style={{ width: 96, height: 96 }}>
              <PokeBallSVG size={96} />
              {["✨","⭐","✨","⭐","✨"].map((s, i) => (
                <span key={i} className="catch-star absolute text-2xl"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    left: `${50 + 85 * Math.cos((i / 5) * 2 * Math.PI)}%`,
                    top:  `${50 + 85 * Math.sin((i / 5) * 2 * Math.PI)}%`,
                  }}>{s}</span>
              ))}
            </div>
            <p className="text-white font-black text-2xl catch-gotcha-text text-center px-6 leading-snug">
              잡았다!<br />{name}을(를) 포획했어!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PetPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PetPageInner />
    </Suspense>
  );
}

function PetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getSeoulDateString();
  const [state, setState] = useState<DailyState | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const [showCatch, setShowCatch] = useState(false);
  const [catchSrc, setCatchSrc] = useState("");
  const [catchName, setCatchName] = useState("");
  const [shareMode, setShareMode] = useState(false);
  const [bonusCount, setBonusCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getDailyState(today);
    if (!s) { router.replace("/"); return; }
    setState(s);
    if (s.isAddedToDex) setShowStamp(true);

    // 공유 링크 방문 기록
    const refId = searchParams.get("ref");
    if (refId) {
      recordVisit(refId, today);
    }

    // 보너스 포켓몬 개수 확인
    getUnclaimedBonusCount(today).then(setBonusCount);
  }, [today, router, searchParams]);

  function handleMissionToggle(index: number) {
    if (!state || state.isAddedToDex) return;
    const updated = updateDailyMission(today, index, !state.missions[index].done);
    if (!updated) return;
    setState({ ...updated });

    if (updated.isAllMissionsDone && !updated.isAddedToDex) {
      setTimeout(() => {
        const isShiny = onMissionsAllComplete(today);
        addToDex(updated.pokemonResult, today, isShiny);
        markAddedToDex(today);

        setState((prev) => prev ? { ...prev, isAddedToDex: true, isShiny } : prev);
        setShowStamp(true);
        setCatchSrc(isShiny ? getShinySpriteUrl(updated.pokemonResult.id) : getSpriteUrl(updated.pokemonResult.id));
        setCatchName(updated.pokemonResult.name);
        setShowCatch(true);
      }, 400);
    }
  }

  async function handleBonusCatch() {
    const claimed = await claimOneBonus(today);
    if (!claimed) return;

    // 아직 없는 포켓몬 중 랜덤
    const collected = getDexCollection().map((e) => e.id);
    const available = ALL_POKEMON_IDS.filter((id) => !collected.includes(id));
    const pool = available.length > 0 ? available : ALL_POKEMON_IDS;
    const randomId = pool[Math.floor(Math.random() * pool.length)];
    const data = getPokemonDisplayData(randomId);
    if (!data) return;

    const bonusPokemon = {
      id: randomId,
      name: data.name,
      nameEn: data.nameEn,
      types: data.types,
      assetPath: getSpriteUrl(randomId),
      description: "보너스로 나타났어!",
    };

    addToDex(bonusPokemon, today, false);
    setBonusCount((prev) => Math.max(0, prev - 1));
    setCatchSrc(getSpriteUrl(randomId));
    setCatchName(data.name);
    setShowCatch(true);
  }

  function handleCopyShare() {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleCatchDone = useCallback(() => setShowCatch(false), []);

  if (!state) return <LoadingScreen />;

  const { pokemonResult, missions, input, isAddedToDex, isShiny } = state;
  const completedCount = missions.filter((m) => m.done).length;
  const mc = input.mainColor;
  const spriteUrl = isShiny ? getShinySpriteUrl(pokemonResult.id) : getSpriteUrl(pokemonResult.id);

  return (
    <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: hexAlpha(mc, 0.05) }}>
      {showCatch && (
        <CatchAnimation src={catchSrc} name={catchName} onDone={handleCatchDone} />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4"
        style={{ backgroundColor: hexAlpha(mc, 0.08) }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: hexAlpha(mc, 0.7) }}>오늘</p>
          <p className="text-sm font-bold text-gray-700">{today}</p>
        </div>
        <Link href="/dex"
          className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-full"
          style={{ backgroundColor: mc, boxShadow: `0 4px 12px ${hexAlpha(mc, 0.4)}` }}>
          📖 도감
        </Link>
      </div>

      {/* Pokemon hero card */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden shadow-xl relative"
        style={{ background: `linear-gradient(135deg, ${mc}cc, ${input.subColor}cc)` }}>

        {showStamp && (
          <div className="absolute top-4 right-4 z-10 stamp-anim">
            <div className="bg-white border-2 text-[10px] font-black px-2 py-1 rounded rotate-[-12deg] shadow"
              style={{ borderColor: mc, color: mc }}>
              등록 완료!
            </div>
          </div>
        )}

        {isShiny && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-yellow-300 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full shadow">
              ✨ 이로치
            </div>
          </div>
        )}

        <div className="flex justify-center pt-8 pb-2 relative">
          <div className="absolute w-44 h-44 rounded-full bg-white/20 blur-2xl top-4" />
          <div className="poke-bounce relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl} alt={pokemonResult.name}
              className="w-40 h-40 object-contain drop-shadow-2xl"
              style={{ imageRendering: "pixelated" }} />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm mx-3 mb-3 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 font-mono">#{String(pokemonResult.id).padStart(3,"0")}</p>
              <h2 className="text-2xl font-black text-gray-800">{pokemonResult.name}</h2>
              {pokemonResult.nameEn && <p className="text-sm text-gray-400">{pokemonResult.nameEn}</p>}
            </div>
            <div className="flex flex-col gap-1 items-end mt-1">
              {pokemonResult.types.map((t) => (
                <span key={t} className="text-xs text-white px-3 py-1 rounded-full font-bold shadow-sm"
                  style={{ backgroundColor: TYPE_COLORS[t] }}>{TYPE_LABELS[t]}</span>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex gap-2">
            <span>💬</span>
            <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{pokemonResult.description}&rdquo;</p>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mc }} />
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: input.subColor }} />
            <span className="text-xs text-gray-400">{MOOD_LABELS[input.mood]}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400 truncate">{input.styleTags.join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Mission checklist */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-800">오늘의 미션</h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: hexAlpha(mc, 0.12), color: mc }}>
            {completedCount}/3
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%`, backgroundColor: mc }} />
        </div>
        <div className="space-y-2.5">
          {missions.map((mission, i) => (
            <button key={i} onClick={() => handleMissionToggle(i)} disabled={isAddedToDex}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all
                ${!isAddedToDex && "active:scale-[0.98]"}`}
              style={{ backgroundColor: mission.done ? hexAlpha(mc, 0.08) : "#f9fafb" }}>
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all"
                style={mission.done
                  ? { backgroundColor: mc, borderColor: mc, color: "white" }
                  : { borderColor: "#d1d5db", backgroundColor: "white" }}>
                {mission.done && <span className="text-xs font-black">✓</span>}
              </div>
              <span className={`text-sm font-medium ${mission.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                {mission.text}
              </span>
            </button>
          ))}
        </div>

        {isAddedToDex && (
          <div className="mt-4 space-y-2">
            <div className="py-3 rounded-2xl text-center"
              style={{ backgroundColor: hexAlpha(mc, 0.1) }}>
              <p className="text-sm font-bold" style={{ color: mc }}>
                {isShiny ? "✨ 이로치 포획! 도감에 등록됐어요." : "🎉 완료! 도감에 등록됐어요."}
              </p>
            </div>

            {/* 보너스 포켓몬 */}
            {bonusCount > 0 && (
              <button
                onClick={handleBonusCatch}
                className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              >
                🎁 보너스 포켓몬 잡기 ({bonusCount}마리 남음)
              </button>
            )}

            {/* 공유하기 */}
            <button
              onClick={handleCopyShare}
              className="w-full py-3 rounded-2xl font-black text-sm active:scale-[0.98] transition-transform border-2"
              style={{ borderColor: mc, color: mc, backgroundColor: hexAlpha(mc, 0.06) }}
            >
              {copied ? "✅ 링크 복사됨!" : "🔗 친구에게 공유하기 (+보너스 포켓몬)"}
            </button>
          </div>
        )}
      </div>

      {/* Save card button */}
      <div className="mx-4 mb-8">
        <button onClick={() => setShareMode(true)}
          className="w-full py-4 text-white font-black rounded-2xl text-base active:scale-95 transition-transform"
          style={{ backgroundColor: mc, boxShadow: `0 4px 16px ${hexAlpha(mc, 0.4)}` }}>
          📸 오늘의 카드 저장
        </button>
      </div>

      {shareMode && <ShareCard state={state} onClose={() => setShareMode(false)} />}
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <PokeBallSVG size={64} spinning />
        </div>
        <p className="text-gray-400 text-sm font-medium">불러오는 중...</p>
      </div>
    </div>
  );
}
