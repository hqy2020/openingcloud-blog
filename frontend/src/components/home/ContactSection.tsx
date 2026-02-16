import { useEffect, useRef, useState } from "react";
import type { HomePayload } from "../../api/home";
import { FadeIn } from "../motion/FadeIn";
import { CardSpotlight } from "../ui/CardSpotlight";

type ContactSectionProps = {
  contact: HomePayload["contact"];
  variant?: "section" | "footer";
};

type IconProps = {
  className: string;
};

function GithubIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
    </svg>
  );
}

function MailIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="14" rx="2.5" width="20" x="2" y="5" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  );
}

function WechatIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="16" rx="3" width="16" x="4" y="4" />
      <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ContactSection({ contact, variant = "section" }: ContactSectionProps) {
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"ok" | "warn">("ok");
  const clearTimerRef = useRef<number | null>(null);
  const isFooter = variant === "footer";

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const showFeedback = (message: string, tone: "ok" | "warn") => {
    setFeedback(message);
    setFeedbackTone(tone);
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }
    clearTimerRef.current = window.setTimeout(() => {
      setFeedback("");
    }, 2800);
  };

  const onEmailClick = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contact.email);
        showFeedback("邮箱已复制，并尝试打开默认邮箱应用。", "ok");
      } else {
        showFeedback("已尝试打开默认邮箱应用。", "ok");
      }
    } catch {
      showFeedback("已尝试打开邮箱，复制失败可手动复制邮箱地址。", "warn");
    }
  };

  const iconSlotClass = isFooter
    ? "flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-[radial-gradient(circle_at_30%_25%,#ffffff,#e5e7eb)] shadow-[inset_0_0_0_7px_rgba(255,255,255,0.45),0_7px_16px_rgba(15,23,42,0.1)] transition duration-200 group-hover:scale-110 group-hover:text-[#4F6AE5]"
    : "flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-[radial-gradient(circle_at_30%_25%,#ffffff,#e5e7eb)] shadow-[inset_0_0_0_10px_rgba(255,255,255,0.45),0_10px_24px_rgba(15,23,42,0.12)] transition duration-200 group-hover:scale-110 group-hover:text-[#4F6AE5] sm:h-28 sm:w-28";
  const iconClass = isFooter ? "h-8 w-8" : "h-12 w-12";
  const links = (
    <div
      className={
        isFooter
          ? "grid w-full grid-cols-3 items-center gap-3 sm:w-auto sm:gap-4"
          : "mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14"
      }
    >
      <a
        aria-label="邮箱"
        className="group flex items-center justify-center text-slate-600"
        href={`mailto:${contact.email}`}
        onClick={() => {
          void onEmailClick();
        }}
        title={`发送邮件到 ${contact.email}`}
      >
        <span className={iconSlotClass}>
          <MailIcon className={iconClass} />
        </span>
      </a>

      <a
        aria-label="GitHub"
        className="group flex items-center justify-center text-slate-600"
        href={contact.github}
        rel="noopener noreferrer"
        target="_blank"
        title="打开 GitHub 新窗口"
      >
        <span className={iconSlotClass}>
          <GithubIcon className={iconClass} />
        </span>
      </a>

      <a
        aria-label="微信"
        className="group flex items-center justify-center text-slate-600"
        href="/media/contact/wechat-qr.jpg"
        rel="noopener noreferrer"
        target="_blank"
        title="打开微信二维码"
      >
        <span className={iconSlotClass}>
          <WechatIcon className={iconClass} />
        </span>
      </a>
    </div>
  );

  if (isFooter) {
    return (
      <div className="relative w-full py-2">
        {feedback ? (
          <div className="absolute right-0 top-0 rounded-full bg-white/95 px-2.5 py-1 text-[11px] shadow-sm ring-1 ring-slate-200">
            <p className={feedbackTone === "ok" ? "text-emerald-700" : "text-amber-700"}>{feedback}</p>
          </div>
        ) : null}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">联系方式</p>
            <p className="mt-1 text-xs text-slate-500">欢迎来信交流技术、效率与生活实践。</p>
          </div>
          {links}
        </div>
      </div>
    );
  }

  return (
    <FadeIn>
      <CardSpotlight className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
        <h2 className="text-2xl font-semibold text-slate-900">联系方式</h2>
        <p className="mt-2 text-slate-600">欢迎来信交流技术、效率与生活实践。</p>

        {feedback ? (
          <div className="absolute right-6 top-6 rounded-full bg-white/95 px-3 py-1.5 text-xs shadow-sm ring-1 ring-slate-200">
            <p className={feedbackTone === "ok" ? "text-emerald-700" : "text-amber-700"}>{feedback}</p>
          </div>
        ) : null}

        {links}
      </CardSpotlight>
    </FadeIn>
  );
}
