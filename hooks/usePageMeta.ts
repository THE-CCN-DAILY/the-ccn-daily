import { useEffect } from 'react';

/**
 * usePageMeta — per-route document head management for a hash-routed SPA.
 *
 * Sets a distinct <title> and meta description per public page and (optionally)
 * injects a page-scoped JSON-LD block. Googlebot renders client JS, so these
 * updates are read for the page the visitor actually lands on. Social link-preview
 * scrapers that don't run JS still get the sensible global tags from index.html.
 *
 * Full server-rendered per-page OG/canonical depends on the deferred
 * HashRouter → BrowserRouter + prerender migration; this is the in-SPA layer.
 */

const SITE = 'THE CCN DAILY';

interface PageMeta {
  /** Page title. " — THE CCN DAILY" is appended unless `rawTitle` is set. */
  title: string;
  description?: string;
  /** Use the title verbatim (e.g. the landing page brand title). */
  rawTitle?: boolean;
  /** A JSON-LD object (or array) injected for this page and removed on unmount. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const JSONLD_ID = 'page-jsonld';

export const usePageMeta = ({ title, description, rawTitle, jsonLd }: PageMeta): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = rawTitle ? title : `${title} — ${SITE}`;

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', document.title);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', document.title);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [title, description, rawTitle, jsonLd]);
};

export default usePageMeta;
