"use client";

// ── 공유 카드 컴포넌트 ──
// html-to-image 사용, 1080×1350 인스타 피드 비율로 저장
import { useRef, useState } from "react";
import type { DailyState } from "@/lib/types";
import { TYPE_COLORS, MOOD_LABELS } from "@/lib/types";
import { formatDisplayDate } from "@/lib/date";

interface Props {
  state: DailyState;
  onClose: () => void;
}

export default function ShareCard({ state, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const { pokemonResult, input, isAddedToDex, date, missions } = state;

  async function handleSave() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      // html-to-image는 클라이언트에서만 동작
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1350,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.download = `daily-pokemon-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("이미지 저장 실패:", e);
      alert("이미지 저장에 실패했습니다. 스크린샷을 이용해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center p-4 gap-4">
      {/* 미리보기 카드 (실제 저장 대상) */}
      <div
        ref={cardRef}
        className="w-full max-w-[360px] rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(160deg, ${input.mainColor}22 0%, ${input.subColor}22 100%)`,
          backgroundColor: "#fff",
        }}
      >
        {/* 카드 헤더 */}
        <div
          className="px-6 pt-6 pb-4"
          style={{
            background: `linear-gradient(135deg, ${input.mainColor}, ${input.subColor})`,
          }}
        >
          <p className="text-white/80 text-sm">{formatDisplayDate(date)}</p>
          <h2 className="text-white text-2xl font-bold mt-1">오늘의 포켓몬</h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 포켓몬 */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">
              🎮
              {/* 실제: <img src={pokemonResult.assetPath} className="pixel-art w-16 h-16" /> */}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono">
                #{String(pokemonResult.id).padStart(3,"0")}
              </p>
              <p className="text-xl font-bold text-gray-800">{pokemonResult.name}</p>
              <div className="flex gap-1 mt-1">
                {pokemonResult.types.map((t) => (
                  <span
                    key={t}
                    className="text-xs text-white px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[t] }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 입력 요약 */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: input.mainColor }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: input.subColor }} />
            </div>
            <span>{MOOD_LABELS[input.mood]}</span>
            <span>·</span>
            <span>{input.styleTags.slice(0,3).join(", ")}</span>
          </div>

          {/* 미션 */}
          <div className="space-y-2">
            {missions.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={m.done ? "text-green-500" : "text-gray-300"}>
                  {m.done ? "✅" : "⬜"}
                </span>
                <span className={m.done ? "line-through text-gray-400" : "text-gray-700"}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          {/* 도감 등록 완료 도장 */}
          {isAddedToDex && (
            <div className="flex justify-center">
              <div className="border-2 border-red-500 text-red-500 text-xs font-bold px-3 py-1.5 rounded rotate-[-8deg] opacity-90">
                도감 등록 완료!
              </div>
            </div>
          )}

          {/* 앱 워터마크 */}
          <p className="text-center text-xs text-gray-300 pt-2">
            오늘의 포켓몬 · Daily Pokémon
          </p>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 w-full max-w-[360px]">
        <button
          onClick={onClose}
          className="flex-1 py-4 bg-white text-gray-700 font-bold rounded-2xl"
        >
          닫기
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl disabled:opacity-60"
        >
          {saving ? "저장 중..." : "💾 저장"}
        </button>
      </div>
    </div>
  );
}
