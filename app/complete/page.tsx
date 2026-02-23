"use client";

// ── 도감 완성 화면 (/complete) ──
import Link from "next/link";

export default function CompletePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="text-7xl animate-bounce">🏆</div>
      <h1 className="text-2xl font-bold text-gray-800">
        도감을 모두 채웠어요!
      </h1>
      <p className="text-gray-500 leading-relaxed">
        1세대 포켓몬 <span className="font-bold text-red-500">151마리</span>를<br />
        전부 수집했습니다. 정말 대단해요!
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {["🌟","🎉","✨","🏅","🎊"].map((e, i) => (
          <span key={i} className="text-3xl">{e}</span>
        ))}
      </div>
      <Link
        href="/dex"
        className="px-8 py-4 bg-red-500 text-white font-bold rounded-2xl text-lg"
      >
        내 도감 보기
      </Link>
    </main>
  );
}
