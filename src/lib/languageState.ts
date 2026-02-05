/**
 * Shared language-state module.
 * LanguageToggle writes here; ChatWidget reads here.
 * No prop-drilling or React Context required.
 */

type Subscriber = (lang: string) => void;

let currentLanguage = 'en';
const subscribers = new Set<Subscriber>();

export function getCurrentLanguage(): string {
  return currentLanguage;
}

export function setLanguage(lang: string): void {
  currentLanguage = lang;
  subscribers.forEach((fn) => fn(lang));
}

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
