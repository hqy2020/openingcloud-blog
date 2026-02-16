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
  return `今天是 ${toIsoDateText(now)}（${toWeekdayText(now)}），节假日数据暂不可用。`;
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

  const tickerMode = useMemo(() => {
    const normalizedMode = payload.social_ticker?.mode;
    if (normalizedMode === "birthday" || normalizedMode === "holiday") {
      return normalizedMode;
    }
    return (payload.birthday_reminders?.length ?? 0) > 0 ? "birthday" : "holiday";
  }, [payload.birthday_reminders?.length, payload.social_ticker?.mode]);
  const tickerTitle = tickerMode === "birthday" ? "生日提醒（未来 7 天）" : "今日日期与节假日";

  const tickerMessages = useMemo(() => {
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
  }, [payload.birthday_reminders, payload.social_ticker?.items]);

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
