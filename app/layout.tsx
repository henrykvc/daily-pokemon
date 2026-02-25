import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "오늘의 포켓몬 | Daily Pokémon",
  description: "오늘의 컬러와 기분으로 나만의 포켓몬을 만나보세요!",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff6b6b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        {/* 최대 너비 480px 모바일 컨테이너 */}
        <div className="max-w-[480px] mx-auto min-h-screen flex flex-col">
          <div className="flex-1 pb-16">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
