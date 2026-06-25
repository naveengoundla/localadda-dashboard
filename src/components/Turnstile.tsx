import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (bot protection).
 *
 * Renders nothing when VITE_TURNSTILE_SITE_KEY is unset, so the app works
 * unchanged until Turnstile is configured. Exposes getToken()/reset() so the
 * caller fetches a fresh token at submit time and resets after each use
 * (Turnstile tokens are single-use).
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      getResponse: (id: string) => string | undefined;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export interface TurnstileHandle {
  getToken: () => string;
  reset: () => void;
}

export const turnstileEnabled = !!SITE_KEY;

const Turnstile = forwardRef<TurnstileHandle>(function Turnstile(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    getToken: () =>
      (widgetId.current && window.turnstile?.getResponse(widgetId.current)) || '',
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !elRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(elRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const i = setInterval(() => {
        if (window.turnstile) {
          clearInterval(i);
          render();
        }
      }, 200);
      return () => clearInterval(i);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={elRef} style={{ marginTop: 12 }} />;
});

export default Turnstile;
