"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSeoulDateString } from "@/lib/date";
import { getDailyState, setDailyState, getCollectedIds } from "@/lib/storage";
import { recommendPokemon } from "@/lib/recommend";
import type { Mood, StyleTag, UserInput, DailyState } from "@/lib/types";
import { MOOD_LABELS, STYLE_TAG_LABELS } from "@/lib/types";

const STYLE_TAGS: StyleTag[] = ["minimal", "street", "casual", "formal", "lovely", "sporty"];
const PRESET_COLORS = [
  "#FF6B6B","#FF9F43","#FECA57","#48DBFB",
  "#1DD1A1","#54A0FF","#5F27CD","#FF9FF3",
  "#2C3E50","#FFFFFF",
];
const MOODS: Mood[] = ["calm","normal","excited","annoyed","sad"];
const STEP_LABELS = ["색상","기분","스타일","미션"];

function ForestBg() {
  return (
    <svg className="absolute inset-0 w-full h-full"
      viewBox="0 0 480 220"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}>
      <defs>
        {/* 포켓몬 GBA 스타일 나무 타일 — 둥근 왕관, 3D 하이라이트/그림자 */}
        <pattern id="fp" width="32" height="30" patternUnits="userSpaceOnUse">
          <rect width="32" height="30" fill="#0e3008"/>
          <ellipse cx="16" cy="15" rx="15" ry="14" fill="#1e6010"/>
          <ellipse cx="16" cy="15" rx="13" ry="12" fill="#286818"/>
          <ellipse cx="10" cy="9"  rx="8"  ry="6"  fill="#3c9020"/>
          <ellipse cx="9"  cy="8"  rx="5"  ry="4"  fill="#54b02c"/>
          <ellipse cx="8"  cy="7"  rx="2.5" ry="2" fill="#6cc838"/>
          <ellipse cx="22" cy="21" rx="7"  ry="5"  fill="#0a2406"/>
          <ellipse cx="23" cy="22" rx="4"  ry="3"  fill="#071a04"/>
        </pattern>
        {/* 밝은 걷기 풀 */}
        <pattern id="gp" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#58c030"/>
          <rect x="0" y="0" width="4" height="4" fill="#68d040" opacity="0.7"/>
          <rect x="4" y="4" width="4" height="4" fill="#48a828" opacity="0.7"/>
        </pattern>
        {/* 긴 풀 (포켓몬 출현 구역) */}
        <pattern id="tgp" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#409820"/>
          <rect x="1" y="0" width="2" height="6" fill="#287010"/>
          <rect x="5" y="1" width="2" height="7" fill="#58b830"/>
        </pattern>
        {/* 모래 길 */}
        <pattern id="pp" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#c8b060"/>
          <rect x="0" y="0" width="4" height="4" fill="#d4bc6c" opacity="0.8"/>
          <rect x="4" y="4" width="4" height="4" fill="#bca858" opacity="0.6"/>
          <rect x="1" y="3" width="2" height="1" fill="#b89848" opacity="0.5"/>
          <rect x="5" y="1" width="2" height="1" fill="#b89848" opacity="0.5"/>
        </pattern>
      </defs>

      {/* 전체 숲 배경 */}
      <rect width="480" height="220" fill="url(#fp)"/>

      {/* 왼쪽 걷기 풀 */}
      <rect x="96"  y="0" width="72" height="220" fill="url(#gp)"/>
      {/* 오른쪽 걷기 풀 */}
      <rect x="312" y="0" width="72" height="220" fill="url(#gp)"/>

      {/* 중앙 모래 길 */}
      <rect x="168" y="0" width="144" height="220" fill="url(#pp)"/>

      {/* 길 가장자리 그림자 (깊이감) */}
      <rect x="168" y="0" width="8"  height="220" fill="rgba(0,0,0,0.22)"/>
      <rect x="304" y="0" width="8"  height="220" fill="rgba(0,0,0,0.22)"/>

      {/* 긴 풀 패치들 (왼쪽) */}
      <rect x="100" y="20"  width="64" height="16" fill="url(#tgp)"/>
      <rect x="104" y="80"  width="56" height="16" fill="url(#tgp)"/>
      <rect x="100" y="140" width="64" height="16" fill="url(#tgp)"/>
      <rect x="100" y="196" width="64" height="16" fill="url(#tgp)"/>

      {/* 긴 풀 패치들 (오른쪽) */}
      <rect x="316" y="48"  width="60" height="16" fill="url(#tgp)"/>
      <rect x="316" y="112" width="60" height="16" fill="url(#tgp)"/>
      <rect x="316" y="170" width="60" height="16" fill="url(#tgp)"/>

      {/* 나무 줄기 (걷기 풀 경계) */}
      <rect x="88"  y="0" width="8" height="220" fill="#1a4c0a"/>
      <rect x="384" y="0" width="8" height="220" fill="#1a4c0a"/>

      {/* 글자 가독성 오버레이 */}
      <rect width="480" height="220" fill="rgba(0,8,0,0.32)"/>
    </svg>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const today = getSeoulDateString();

  useEffect(() => {
    const existing = getDailyState(today);
    if (existing) router.replace("/pet");
  }, [today, router]);

  const [mainColor, setMainColor] = useState("#FF6B6B");
  const [subColor, setSubColor] = useState("#48DBFB");
  const [mood, setMood] = useState<Mood>("normal");
  const [moodText, setMoodText] = useState("");
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [missions, setMissions] = useState(["","",""]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  function toggleStyle(tag: StyleTag) {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }
  function setMissionAt(i: number, val: string) {
    setMissions((prev) => { const n = [...prev]; n[i] = val; return n; });
  }
  function canSubmit() {
    return missions.every((m) => m.trim().length > 0) && styleTags.length > 0;
  }
  function handleSubmit() {
    if (!canSubmit() || submitting) return;
    setSubmitting(true);
    const input: UserInput = { mainColor, subColor, mood, moodText: moodText.trim() || undefined, styleTags };
    const collectedIds = getCollectedIds();
    const { pokemon, isComplete } = recommendPokemon(input, collectedIds, today);
    if (isComplete || !pokemon) { router.push("/complete"); return; }
    const state: DailyState = {
      date: today, input,
      missions: missions.map((text) => ({ text: text.trim(), done: false })),
      pokemonResult: {
        id: pokemon.id, name: pokemon.name, nameEn: pokemon.nameEn, types: pokemon.types,
        assetPath: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`,
        description: pokemon.description,
      },
      isAllMissionsDone: false, isAddedToDex: false,
    };
    setDailyState(state);
    router.push("/pet");
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Forest Header */}
      <div className="relative px-5 pt-12 pb-10 text-center overflow-hidden" style={{ minHeight: 180 }}>
        <ForestBg />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-2 drop-shadow">오늘의 포켓몬</p>
          <h1 className="text-3xl font-black text-white drop-shadow-lg">나의 포켓몬 찾기</h1>
          <p className="text-white/70 text-sm mt-1 drop-shadow">{today}</p>
        </div>
      </div>

      {/* White card */}
      <div className="flex-1 bg-white rounded-t-[2rem] px-5 pt-6 pb-10 shadow-2xl -mt-6 relative z-10">
        {/* Steps */}
        <div className="flex gap-1 mb-7">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div className={`h-1.5 rounded-full mb-1 transition-colors ${i + 1 <= step ? "bg-red-500" : "bg-gray-100"}`} />
              <span className={`text-[10px] font-bold ${i + 1 <= step ? "text-red-500" : "text-gray-300"}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Colors */}
        {step === 1 && (
          <section className="space-y-5">
            <h2 className="text-xl font-black text-gray-800">🎨 색상 선택</h2>
            <div className="h-12 rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(90deg, ${mainColor} 50%, ${subColor} 50%)` }} />
            {([["메인", mainColor, setMainColor], ["서브", subColor, setSubColor]] as const).map(([label, val, setter]) => (
              <div key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setter(c)}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${val === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <input type="color" value={val} onChange={(e) => setter(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer" />
              </div>
            ))}
            <button onClick={() => setStep(2)}
              className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-lg shadow-lg shadow-red-100 active:scale-95 transition-transform">
              다음 →
            </button>
          </section>
        )}

        {/* STEP 2: Mood */}
        {step === 2 && (
          <section className="space-y-3">
            <h2 className="text-xl font-black text-gray-800">💭 오늘 기분이 어때요?</h2>
            {MOODS.map((m) => (
              <button key={m} onClick={() => setMood(m)}
                className={`w-full py-3.5 px-5 rounded-2xl text-left text-base font-semibold border-2 transition-all ${
                  mood === m ? "border-red-400 bg-red-50 scale-[1.01]" : "border-gray-100 bg-gray-50"}`}>
                {MOOD_LABELS[m]}
              </button>
            ))}
            <input type="text" value={moodText} onChange={(e) => setMoodText(e.target.value)}
              placeholder="기분을 한 줄로... (선택)" maxLength={50}
              className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300" />
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">← 이전</button>
              <button onClick={() => setStep(3)} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-transform">다음 →</button>
            </div>
          </section>
        )}

        {/* STEP 3: Style */}
        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-800">👗 오늘의 스타일</h2>
            <p className="text-sm text-gray-400">해당하는 것 모두 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleStyle(tag)}
                  className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                    styleTags.includes(tag)
                      ? "bg-red-500 text-white border-red-500 scale-[1.02]"
                      : "bg-white text-gray-600 border-gray-200"}`}>
                  {STYLE_TAG_LABELS[tag]}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">← 이전</button>
              <button onClick={() => setStep(4)} disabled={styleTags.length === 0}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-100 disabled:opacity-40 active:scale-95 transition-transform">다음 →</button>
            </div>
          </section>
        )}

        {/* STEP 4: Missions */}
        {step === 4 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-800">✅ 오늘의 미션</h2>
            <p className="text-sm text-gray-400">미션 3개 완료 → 포켓몬이 도감에 등록돼요!</p>
            <div className="space-y-3">
              {[0,1,2].map((i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 focus-within:border-red-300 transition-colors">
                  <span className="text-red-400 font-black text-xl">{i + 1}</span>
                  <input type="text" value={missions[i]} onChange={(e) => setMissionAt(i, e.target.value)}
                    placeholder={["예) 물 2리터 마시기","예) 30분 산책하기","예) 책 10페이지 읽기"][i]}
                    maxLength={40}
                    className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-gray-300" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">← 이전</button>
              <button onClick={handleSubmit} disabled={!canSubmit() || submitting}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-100 disabled:opacity-40 active:scale-95 transition-transform">
                {submitting ? "찾는 중..." : "포켓몬 만나기! 🎮"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
