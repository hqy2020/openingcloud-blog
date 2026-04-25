import { Component } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
};

type State = { hasError: boolean };

export class SafeBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (typeof console !== "undefined") {
      console.error(`[SafeBoundary${this.props.label ? `:${this.props.label}` : ""}] caught:`, error);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      const label = this.props.label ?? "section";
      return (
        <div className="rounded-2xl border border-red-300/60 bg-red-50/60 px-4 py-3 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          [{label}] 渲染出错，详见浏览器 console
        </div>
      );
    }
    return this.props.children;
  }
}
