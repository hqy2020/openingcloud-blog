import type {
  CreateTypes as ConfettiInstance,
  GlobalOptions as ConfettiGlobalOptions,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
} from "react";

type ConfettiApi = {
  fire: (options?: ConfettiOptions) => Promise<void>;
};

type ConfettiProps = ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualStart?: boolean;
};

export type ConfettiRef = ConfettiApi | null;

const DEFAULT_GLOBAL_OPTIONS: ConfettiGlobalOptions = {
  resize: true,
  useWorker: true,
};

const ConfettiComponent = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
  { options, globalOptions = DEFAULT_GLOBAL_OPTIONS, manualStart = false, ...rest },
  ref,
) {
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const bindCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas) {
        if (instanceRef.current) {
          return;
        }

        instanceRef.current = confetti.create(canvas, {
          ...globalOptions,
          resize: true,
        });
        return;
      }

      if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    },
    [globalOptions],
  );

  const fire = useCallback(
    async (overrideOptions: ConfettiOptions = {}) => {
      await instanceRef.current?.({ ...options, ...overrideOptions });
    },
    [options],
  );

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire],
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (manualStart) {
      return;
    }
    void fire();
  }, [fire, manualStart]);

  return <canvas ref={bindCanvas} {...rest} />;
});

ConfettiComponent.displayName = "Confetti";

export const Confetti = ConfettiComponent;
