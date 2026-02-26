import { supabase } from "./supabase";

function generateUserId(): string {
  return (
    "u_" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem("userId", userId);
  }
  return userId;
}

export function getShareUrl(): string {
  const userId = getUserId();
  return `${window.location.origin}/?ref=${userId}`;
}

export async function recordVisit(sharerId: string, date: string): Promise<void> {
  const visitorId = getUserId();
  if (!visitorId || visitorId === sharerId) return;

  // 오늘 이미 방문 기록 있으면 스킵
  const { data } = await supabase
    .from("referral_visits")
    .select("id")
    .eq("sharer_id", sharerId)
    .eq("visitor_id", visitorId)
    .eq("date", date)
    .maybeSingle();

  if (data) return;

  await supabase.from("referral_visits").insert({
    sharer_id: sharerId,
    visitor_id: visitorId,
    date,
  });
}

export async function getUnclaimedBonusCount(date: string): Promise<number> {
  const userId = getUserId();
  if (!userId) return 0;

  const { count } = await supabase
    .from("referral_visits")
    .select("*", { count: "exact", head: true })
    .eq("sharer_id", userId)
    .eq("date", date)
    .eq("bonus_granted", false);

  return Math.min(count ?? 0, 3);
}

export async function claimOneBonus(date: string): Promise<boolean> {
  const userId = getUserId();
  if (!userId) return false;

  const { data } = await supabase
    .from("referral_visits")
    .select("id")
    .eq("sharer_id", userId)
    .eq("date", date)
    .eq("bonus_granted", false)
    .limit(1)
    .maybeSingle();

  if (!data) return false;

  await supabase
    .from("referral_visits")
    .update({ bonus_granted: true })
    .eq("id", data.id);

  return true;
}
