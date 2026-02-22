import type { CSSProperties } from "react";
import { useMemo } from "react";
import { fetchHome } from "../../api/home";
import { fallbackHomePayload } from "../../data/fallback";
import { useAsync } from "../../hooks/useAsync";

function toIsoDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toWeekdayText(date: Date) {
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return labels[date.getDay()] ?? "周?";
}

function fallbackTickerMessage() {
  const now = new Date();
  const todayStr = toIsoDateText(now);
  const weekday = toWeekdayText(now);

  const todayHoliday = findHolidayByDate(todayStr);
  if (todayHoliday) {
    return `今天是 ${todayStr}（${weekday}），${todayHoliday} 🎉`;
  }

  const next = findNextHoliday(now);
  if (next) {
    return `今天是 ${todayStr}（${weekday}），距${next.name}还有 ${next.daysUntil} 天`;
  }

  return `今天是 ${todayStr}（${weekday}）`;
}

/* ── Chinese holidays (static table) ──────────── */

type HolidayEntry = { month: number; day: number; name: string };

const FIXED_HOLIDAYS: HolidayEntry[] = [
  { month: 1, day: 1, name: "元旦" },
  { month: 3, day: 8, name: "妇女节" },
  { month: 5, day: 1, name: "劳动节" },
  { month: 5, day: 4, name: "青年节" },
  { month: 6, day: 1, name: "儿童节" },
  { month: 10, day: 1, name: "国庆节" },
];

// Lunar holidays are year-specific; cover a few years for reliability.
const LUNAR_HOLIDAYS: Record<number, HolidayEntry[]> = {
  2025: [
    { month: 1, day: 29, name: "春节" },
    { month: 2, day: 12, name: "元宵节" },
    { month: 4, day: 4, name: "清明节" },
    { month: 5, day: 31, name: "端午节" },
    { month: 10, day: 6, name: "中秋节" },
  ],
  2026: [
    { month: 2, day: 17, name: "春节" },
    { month: 3, day: 3, name: "元宵节" },
    { month: 4, day: 5, name: "清明节" },
    { month: 6, day: 19, name: "端午节" },
    { month: 9, day: 25, name: "中秋节" },
  ],
  2027: [
    { month: 2, day: 6, name: "春节" },
    { month: 2, day: 20, name: "元宵节" },
    { month: 4, day: 5, name: "清明节" },
    { month: 6, day: 9, name: "端午节" },
    { month: 9, day: 15, name: "中秋节" },
  ],
};

function getHolidaysForYear(year: number): HolidayEntry[] {
  return [...FIXED_HOLIDAYS, ...(LUNAR_HOLIDAYS[year] ?? [])];
}

function findHolidayByDate(dateStr: string): string | null {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const match = getHolidaysForYear(year).find((h) => h.month === month && h.day === day);
  return match?.name ?? null;
}

function findNextHoliday(now: Date): { name: string; daysUntil: number } | null {
  const year = now.getFullYear();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const candidates: { name: string; ms: number }[] = [];
  for (const y of [year, year + 1]) {
    for (const h of getHolidaysForYear(y)) {
      const ms = new Date(y, h.month - 1, h.day).getTime();
      if (ms > todayMs) {
        candidates.push({ name: h.name, ms });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.ms - b.ms);
  const daysUntil = Math.round((candidates[0].ms - todayMs) / 86_400_000);
  return { name: candidates[0].name, daysUntil };
}

function rgba(rgb: string, alpha: number) {
  return `rgba(${rgb}, ${alpha})`;
}

type GlobalSloganTickerProps = {
  isDark: boolean;
  accentRgb: string;
};

export function GlobalSloganTicker({ isDark, accentRgb }: GlobalSloganTickerProps) {
  const { data } = useAsync(fetchHome, []);
  const payload = data ?? fallbackHomePayload;

  const honorMessages = useMemo(() => {
    const stages = Array.isArray(payload.highlights) ? payload.highlights : [];
    const messages = stages.flatMap((stage) =>
      (stage.items ?? [])
        .map((item) => String(item?.title || "").trim())
        .filter((item) => item.length > 0)
        .map((item) => `${stage.title} · ${item}`),
    );
    return messages;
  }, [payload.highlights]);

  const tickerMode = useMemo(() => {
    if (honorMessages.length > 0) {
      return "honors";
    }
    const normalizedMode = payload.social_ticker?.mode;
    if (normalizedMode === "birthday" || normalizedMode === "holiday") {
      return normalizedMode;
    }
    return (payload.birthday_reminders?.length ?? 0) > 0 ? "birthday" : "holiday";
  }, [honorMessages.length, payload.birthday_reminders?.length, payload.social_ticker?.mode]);
  const tickerTitle =
    tickerMode === "honors"
      ? "荣誉滚动"
      : tickerMode === "birthday"
        ? "生日提醒（未来 7 天）"
        : "今日日期与节假日";

  const tickerMessages = useMemo(() => {
    if (honorMessages.length > 0) {
      return honorMessages.slice(0, 8);
    }

    const fromSocialTicker =
      payload.social_ticker?.items
        ?.map((item) => String(item?.message || "").trim())
        .filter((item) => item.length > 0) ?? [];
    if (fromSocialTicker.length > 0) {
      return fromSocialTicker;
    }

    const fromBirthdayReminders =
      payload.birthday_reminders
        ?.map((item) => String(item.message || "").trim())
        .filter((item) => item.length > 0) ?? [];
    if (fromBirthdayReminders.length > 0) {
      return fromBirthdayReminders;
    }

    return [fallbackTickerMessage()];
  }, [honorMessages, payload.birthday_reminders, payload.social_ticker?.items]);

  const marqueeMessages = useMemo(() => {
    if (tickerMessages.length === 0) {
      return [];
    }
    if (tickerMessages.length === 1) {
      return [tickerMessages[0], tickerMessages[0]];
    }
    return tickerMessages.slice(0, 2);
  }, [tickerMessages]);

  if (marqueeMessages.length === 0) {
    return null;
  }

  const stripStyle: CSSProperties = isDark
    ? {
        background: `linear-gradient(180deg, rgba(2,6,23,0), ${rgba(accentRgb, 0.18)} 38%, rgba(2,6,23,0))`,
        color: "rgba(226,236,255,0.9)",
      }
    : {
        background: `linear-gradient(180deg, rgba(255,255,255,0), ${rgba(accentRgb, 0.13)} 38%, rgba(255,255,255,0))`,
        color: "rgba(51,65,85,0.9)",
      };
  const labelStyle: CSSProperties = {
    color: isDark ? "rgba(191,219,254,0.92)" : rgba(accentRgb, 0.96),
  };

  return (
    <div className="w-full global-slogan-strip" style={stripStyle}>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-1">
        <span className="global-slogan-label" style={labelStyle}>
          {tickerTitle}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div aria-live="polite" className="social-ticker-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="social-ticker-segment">
                {marqueeMessages.map((message, index) => (
                  <span key={`${copy}-${index}`} className="global-slogan-item">
                    {message}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
