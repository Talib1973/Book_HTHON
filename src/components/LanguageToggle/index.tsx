import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '../../lib/auth-client';
import { setLanguage } from '../../lib/languageState';
import styles from './styles.module.css';

// ── Slug map: Docusaurus page path → static Urdu file path (Decision 5) ──
const SLUG_MAP: Record<string, string> = {
  '/docs/intro':                                          '/docs-ur/intro.md',
  '/docs/module-1-ros2':                                  '/docs-ur/module-1-ros2/index.md',
  '/docs/module-1-ros2/week-3-ros2-architecture':         '/docs-ur/module-1-ros2/week-3-ros2-architecture.md',
  '/docs/module-1-ros2/week-4-pub-sub':                   '/docs-ur/module-1-ros2/week-4-pub-sub.md',
  '/docs/module-1-ros2/week-5-services-actions':          '/docs-ur/module-1-ros2/week-5-services-actions.md',
  '/docs/module-2-digital-twin':                          '/docs-ur/module-2-digital-twin/index.md',
  '/docs/module-3-isaac':                                 '/docs-ur/module-3-isaac/index.md',
  '/docs/module-4-vla':                                   '/docs-ur/module-4-vla/index.md',
  '/docs/capstone':                                       '/docs-ur/capstone/index.md',
};

// ── In-memory fetch cache (T022) ──
const urduCache = new Map<string, string>();

// ── Lazy font loader (T012) ──
function ensureNotoNastaliq(): void {
  if (document.getElementById('noto-nastaliq-link')) return;
  const link = document.createElement('link');
  link.id = 'noto-nastaliq-link';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq:wght@400;600&display=swap';
  document.head.appendChild(link);
}

export default function LanguageToggle(): React.ReactNode {
  const { data: session, isPending } = useSession();

  // Guard 1: session still loading
  if (isPending) return null;
  // Guard 2: not signed in
  if (!session?.user) return null;

  // Guard 3: current page has no Urdu translation — checked inside the inner component
  // (useLocation can only run inside a router context, so we delegate)
  return <LanguageToggleInner />;
}

// ── Docusaurus useLocation hook — dynamic import to avoid SSR issues ──
function useDocusaurusLocation(): { pathname: string } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useLocation } = require('@docusaurus/router');
  return useLocation();
}

function LanguageToggleInner(): React.ReactNode {
  const location = useDocusaurusLocation();
  const pathname = location.pathname;
  const urduPath = SLUG_MAP[pathname];

  // Guard 3: no translation for this page
  if (!urduPath) return null;

  return <LanguageToggleWidget urduPath={urduPath} />;
}

interface LanguageToggleWidgetProps {
  urduPath: string;
}

function LanguageToggleWidget({ urduPath }: LanguageToggleWidgetProps): React.ReactNode {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [urduContent, setUrduContent] = useState<string | null>(null);
  const originalRef = useRef<string | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const didAutoApply = useRef(false);

  // ── Resolve initial preference on mount ──
  useEffect(() => {
    didAutoApply.current = false;

    fetch('/api/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        const pref: string =
          profile?.language_preference ||
          (typeof window !== 'undefined' ? localStorage.getItem('ba_language_pref') : null) ||
          'en';
        if (pref === 'ur') {
          applyUrdu();
        }
      })
      .catch(() => {
        // Network failure — fall back to localStorage
        const pref =
          typeof window !== 'undefined' ? localStorage.getItem('ba_language_pref') : null;
        if (pref === 'ur') {
          applyUrdu();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urduPath]);

  // ── Capture original Docusaurus content on mount (once) ──
  useEffect(() => {
    const el = document.querySelector('.docItemContent');
    if (el && originalRef.current === null) {
      originalRef.current = el.innerHTML;
    }
  }, []);

  // ── React-markdown renderer — loaded dynamically to keep SSR clean ──
  useEffect(() => {
    if (lang === 'ur' && urduContent && contentContainerRef.current) {
      import('react-markdown').then(({ default: ReactMarkdown }) => {
        import('rehype-highlight').then(({ default: rehypeHighlight }) => {
          // We render via ReactDOM into the container
          import('react-dom/client').then(({ createRoot }) => {
            const container = contentContainerRef.current!;
            const root = createRoot(container);
            root.render(
              <div dir="rtl" lang="ur" className={styles.urduContent}>
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{urduContent}</ReactMarkdown>
              </div>
            );
          });
        });
      });
    }
  }, [lang, urduContent]);

  // ── Fetch + apply Urdu content ──
  async function applyUrdu(): Promise<void> {
    // Capture original before overwriting
    const el = document.querySelector('.docItemContent');
    if (el && originalRef.current === null) {
      originalRef.current = el.innerHTML;
    }

    ensureNotoNastaliq();

    let text = urduCache.get(urduPath);
    if (!text) {
      try {
        const res = await fetch(urduPath);
        if (!res.ok) {
          console.warn('[LanguageToggle] Urdu file not found:', urduPath);
          return;
        }
        text = await res.text();
        // Strip YAML front matter (between --- delimiters) before rendering
        text = text.replace(/^---[\s\S]*?---\s*/, '');
        urduCache.set(urduPath, text);
      } catch {
        console.warn('[LanguageToggle] Failed to fetch Urdu content');
        return;
      }
    }

    setUrduContent(text);
    setLang('ur');
    setLanguage('ur');
    persistPreference('ur');
  }

  // ── Restore English content ──
  function applyEnglish(): void {
    if (originalRef.current !== null) {
      const el = document.querySelector('.docItemContent');
      if (el) el.innerHTML = originalRef.current;
    }
    setUrduContent(null);
    setLang('en');
    setLanguage('en');
    persistPreference('en');
  }

  // ── Persist to localStorage + server (best-effort, non-blocking) ──
  function persistPreference(value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ba_language_pref', value);
    }
    // Fire-and-forget POST
    fetch('/api/profile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_preference: value }),
    }).catch(() => {
      // Non-blocking: preference already saved to localStorage
    });
  }

  // ── Render: swap docItemContent with our container when Urdu is active ──
  useEffect(() => {
    if (lang === 'ur') {
      // Hide the original Docusaurus content and show our container
      const original = document.querySelector('.docItemContent');
      if (original) {
        original.setAttribute('data-lang-hidden', 'true');
        original.style.display = 'none';
      }
      // Ensure our container is visible
      if (contentContainerRef.current) {
        contentContainerRef.current.style.display = 'block';
      }
    } else {
      // Show original, hide our container
      const original = document.querySelector('.docItemContent');
      if (original) {
        original.removeAttribute('data-lang-hidden');
        original.style.display = '';
      }
      if (contentContainerRef.current) {
        contentContainerRef.current.style.display = 'none';
      }
    }
  }, [lang]);

  return (
    <>
      <div className={styles.toggleContainer}>
        <button
          className={`${styles.toggleBtn} ${lang === 'ur' ? styles.active : ''}`}
          aria-pressed={lang === 'ur'}
          aria-label="Switch to Urdu"
          onClick={() => applyUrdu()}
        >
          اردو
        </button>
        <button
          className={`${styles.toggleBtn} ${lang === 'en' ? styles.active : ''}`}
          aria-pressed={lang === 'en'}
          aria-label="Switch to English"
          onClick={() => applyEnglish()}
        >
          English
        </button>
      </div>
      {/* Container for react-markdown rendered Urdu content */}
      <div
        ref={contentContainerRef}
        style={{ display: lang === 'ur' ? 'block' : 'none' }}
      />
    </>
  );
}
