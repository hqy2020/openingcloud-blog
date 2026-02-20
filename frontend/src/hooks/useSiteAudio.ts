import { useCallback, useEffect, useRef, useState } from "react";
import type { ThemeMode } from "../app/theme";

type UseSiteAudioOptions = {
  theme: ThemeMode;
  homeRouteActive: boolean;
};

type UseSiteAudioResult = {
  enabled: boolean;
  playing: boolean;
  toggleEnabled: () => void;
  requestPlayFromUserGesture: () => void;
  ready: boolean;
};

const AUDIO_STORAGE_KEY = "openingcloud-audio-enabled";
const LIGHT_TRACK_SRC = "/media/audio/theme-light.mp3";
const DARK_TRACK_SRC = "/media/audio/theme-dark.mp3";
const TARGET_VOLUME = 0.42;
const FADE_DURATION_MS = 280;

function resolveTrack(theme: ThemeMode) {
  return theme === "dark" ? DARK_TRACK_SRC : LIGHT_TRACK_SRC;
}

function sameTrackSource(audio: HTMLAudioElement, source: string) {
  const current = audio.currentSrc || audio.src || "";
  return current.endsWith(source);
}

function clampVolume(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function readInitialEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (stored === "off") {
      return false;
    }
    if (stored === "on") {
      return true;
    }
  } catch {
    // Ignore storage read failures and keep default.
  }
  return true;
}

export function useSiteAudio({ theme, homeRouteActive }: UseSiteAudioOptions): UseSiteAudioResult {
  const [enabled, setEnabled] = useState(readInitialEnabled);
  const [playing, setPlaying] = useState(false);
  const ready = typeof window !== "undefined";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);
  const enabledRef = useRef(enabled);
  const themeRef = useRef(theme);
  const homeAutoplayUnlockedRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (fadeRafRef.current !== null) {
      window.cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, transitionId: number) =>
      new Promise<void>((resolve) => {
        const startVolume = clampVolume(from);
        const targetVolume = clampVolume(to);
        if (Math.abs(startVolume - targetVolume) < 0.001) {
          audio.volume = targetVolume;
          resolve();
          return;
        }

        cancelFade();
        const startedAt = performance.now();

        const tick = (timestamp: number) => {
          if (transitionIdRef.current !== transitionId) {
            resolve();
            return;
          }

          const progress = Math.min(1, (timestamp - startedAt) / FADE_DURATION_MS);
          audio.volume = clampVolume(startVolume + (targetVolume - startVolume) * progress);

          if (progress < 1) {
            fadeRafRef.current = window.requestAnimationFrame(tick);
            return;
          }

          fadeRafRef.current = null;
          resolve();
        };

        fadeRafRef.current = window.requestAnimationFrame(tick);
      }),
    [cancelFade],
  );

  const ensurePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabledRef.current) {
      return;
    }

    const expectedTrack = resolveTrack(themeRef.current);
    if (!sameTrackSource(audio, expectedTrack)) {
      audio.src = expectedTrack;
      audio.load();
    }

    if (!audio.paused) {
      return;
    }

    const transitionId = ++transitionIdRef.current;
    audio.volume = 0;
    try {
      await audio.play();
      await fadeVolume(audio, 0, TARGET_VOLUME, transitionId);
    } catch {
      // Ignore blocked play attempts; a future user interaction will retry.
    }
  }, [fadeVolume]);

  const switchTrackWithFade = useCallback(
    async (nextTrack: string) => {
      const audio = audioRef.current;
      if (!audio || sameTrackSource(audio, nextTrack)) {
        return;
      }

      const shouldKeepPlaying = enabledRef.current && !audio.paused;
      const transitionId = ++transitionIdRef.current;

      if (shouldKeepPlaying) {
        await fadeVolume(audio, audio.volume, 0, transitionId);
        if (transitionIdRef.current !== transitionId) {
          return;
        }
        audio.pause();
      }

      audio.src = nextTrack;
      audio.load();

      if (!shouldKeepPlaying) {
        audio.volume = TARGET_VOLUME;
        return;
      }

      audio.volume = 0;
      try {
        await audio.play();
        await fadeVolume(audio, 0, TARGET_VOLUME, transitionId);
      } catch {
        // Keep paused if replay fails.
      }
    },
    [fadeVolume],
  );

  const requestPlayFromUserGesture = useCallback(() => {
    homeAutoplayUnlockedRef.current = true;
    void ensurePlayback();
  }, [ensurePlayback]);

  const toggleEnabled = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      if (next) {
        // The click on toggle itself is already a user gesture.
        homeAutoplayUnlockedRef.current = true;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const audio = new Audio(resolveTrack(themeRef.current));
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = TARGET_VOLUME;
    audioRef.current = audio;

    const syncPlaying = () => {
      setPlaying(!audio.paused && !audio.ended);
    };

    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);
    syncPlaying();
    if (enabledRef.current && homeAutoplayUnlockedRef.current) {
      void ensurePlayback();
    }

    return () => {
      transitionIdRef.current += 1;
      cancelFade();
      audio.pause();
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
      audioRef.current = null;
    };
  }, [cancelFade, ensurePlayback]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Ignore storage write failures.
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!enabled) {
      transitionIdRef.current += 1;
      cancelFade();
      audio.pause();
      return;
    }

    if (homeAutoplayUnlockedRef.current) {
      void ensurePlayback();
    }
  }, [cancelFade, enabled, ensurePlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const expectedTrack = resolveTrack(theme);
    if (enabledRef.current && !audio.paused) {
      void switchTrackWithFade(expectedTrack);
      return;
    }

    if (!sameTrackSource(audio, expectedTrack)) {
      audio.src = expectedTrack;
      audio.load();
      audio.volume = TARGET_VOLUME;
    }
  }, [switchTrackWithFade, theme]);

  useEffect(() => {
    if (!homeRouteActive || !enabled || homeAutoplayUnlockedRef.current) {
      return;
    }

    const onFirstGesture = () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      requestPlayFromUserGesture();
    };

    window.addEventListener("pointerdown", onFirstGesture, { passive: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("keydown", onFirstGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [enabled, homeRouteActive, requestPlayFromUserGesture]);

  return {
    enabled,
    playing,
    toggleEnabled,
    requestPlayFromUserGesture,
    ready,
  };
}
