"use client";

// ── Setup 페이지 (/) ──────────────────────────────────────
// 색상, 기분, 스타일, 미션 입력 후 포켓몬 추천

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSeoulDateString } from "@/lib/date";
import { getDailyState, setDailyState, getCollectedIds } from "@/lib/storage";
import { recommendPokemon } from "@/lib/recommend";
import type { Mood, StyleTag, UserInput, DailyState } from "@/lib/types";
import { MOOD_LABELS, STYLE_TAG_LABELS } from "@/lib/types";

const STYLE_TAGS: StyleTag[] = [
  "minimal","street","casual","formal","girly",
  "sporty","vintage","dandy","techwear","amekaji",
];

const PRESET_COLORS = [
  "#FF6B6B","#FF9F43","#FECA57","#48DBFB",
  "#1DD1A1","#54A0FF","#5F27CD","#FF9FF3",
  "#2C3E50","#FFFFFF",
];

const MOODS: Mood[] = ["calm","normal","excited","annoyed","sad"];

export default function SetupPage() {
  const router = useRouter();
  const today = getSeoulDateString();

  // 이미 오늘 데이터가 있으면 /pet 이동
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
  const [step, setStep] = useState(1); // 단계별 UI (1~4)
  const [submitting, setSubmitting] = useState(false);

  function toggleStyle(tag: StyleTag) {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function setMissionAt(i: number, val: string) {
    setMissions((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  function canSubmit() {
    return missions.every((m) => m.trim().length > 0) && styleTags.length > 0;
  }

  function handleSubmit() {
    if (!canSubmit() || submitting) return;
    setSubmitting(true);

    const input: UserInput = {
      mainColor,
      subColor,
      mood,
      moodText: moodText.trim() || undefined,
      styleTags,
    };

    const collectedIds = getCollectedIds();
    const { pokemon, isComplete } = recommendPokemon(input, collectedIds, today);

    if (isComplete || !pokemon) {
      // 도감 완성 화면 (별도 처리)
      router.push("/complete");
      return;
    }

    const state: DailyState = {
      date: today,
      input,
      missions: missions.map((text) => ({ text: text.trim(), done: false })),
      pokemonResult: {
        id: pokemon.id,
        name: pokemon.name,
        nameEn: pokemon.nameEn,
        types: pokemon.types,
        assetPath: `/assets/pokemon/${pokemon.id}.png`,
        description: pokemon.description,
      },
      isAllMissionsDone: false,
      isAddedToDex: false,
    };

    setDailyState(state);
    router.push("/pet");
  }

  return (
    <main className="flex-1 p-4 pb-8">
      {/* 헤더 */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-red-500">오늘의 포켓몬</h1>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {/* Step 인디케이터 */}
      <div className="flex gap-2 mb-6">
        {[1,2,3,4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? "bg-red-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: 색상 선택 */}
      {step === 1 && (
        <section className="space-y-5">
          <h2 className="text-lg font-bold">🎨 색상을 골라봐요</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메인 색
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setMainColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    mainColor === c ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={mainColor}
                onChange={(e) => setMainColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 font-mono">{mainColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서브 색
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSubColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    subColor === c ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={subColor}
                onChange={(e) => setSubColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 font-mono">{subColor}</span>
            </div>
          </div>

          {/* 색상 미리보기 */}
          <div
            className="h-12 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${mainColor} 50%, ${subColor} 50%)`,
            }}
          />

          <button
            onClick={() => setStep(2)}
            className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform"
          >
            다음 →
          </button>
        </section>
      )}

      {/* STEP 2: 기분 선택 */}
      {step === 2 && (
        <section className="space-y-5">
          <h2 className="text-lg font-bold">💭 오늘 기분은?</h2>

          <div className="grid grid-cols-1 gap-3">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`py-4 px-5 rounded-2xl text-left text-lg font-medium border-2 transition-all ${
                  mood === m
                    ? "border-red-400 bg-red-50 scale-[1.02]"
                    : "border-gray-200 bg-white"
                }`}
              >
                {MOOD_LABELS[m]}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              한 줄로 표현해봐요 (선택)
            </label>
            <input
              type="text"
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              placeholder="예) 오늘은 좀 무기력하지만 괜찮아"
              maxLength={50}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-red-400"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-lg"
            >
              ← 이전
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform"
            >
              다음 →
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: 스타일 태그 */}
      {step === 3 && (
        <section className="space-y-5">
          <h2 className="text-lg font-bold">👗 오늘의 스타일</h2>
          <p className="text-sm text-gray-500">여러 개 선택 가능해요</p>

          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleStyle(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                  styleTags.includes(tag)
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {STYLE_TAG_LABELS[tag]}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-lg"
            >
              ← 이전
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={styleTags.length === 0}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl text-lg disabled:opacity-40 active:scale-95 transition-transform"
            >
              다음 →
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: 미션 입력 */}
      {step === 4 && (
        <section className="space-y-5">
          <h2 className="text-lg font-bold">✅ 오늘의 미션 3가지</h2>
          <p className="text-sm text-gray-500">미션을 모두 완료하면 포켓몬이 도감에 등록돼요!</p>

          <div className="space-y-3">
            {[0,1,2].map((i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  미션 {i + 1}
                </label>
                <input
                  type="text"
                  value={missions[i]}
                  onChange={(e) => setMissionAt(i, e.target.value)}
                  placeholder={
                    i === 0 ? "예) 물 2L 마시기" :
                    i === 1 ? "예) 30분 산책" :
                    "예) 책 10페이지 읽기"
                  }
                  maxLength={40}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-red-400"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-lg"
            >
              ← 이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl text-lg disabled:opacity-40 active:scale-95 transition-transform"
            >
              {submitting ? "생성 중..." : "포켓몬 만나기 🎮"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
