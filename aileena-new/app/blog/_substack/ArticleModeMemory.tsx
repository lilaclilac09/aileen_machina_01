'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'aileena-article-view';

export type ArticleMode = 'dense' | 'explainer';

export function setArticleMode(mode: ArticleMode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // private mode / quota; ignore — toggle still navigates
  }
}

function getArticleMode(): ArticleMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dense' || v === 'explainer' ? v : null;
  } catch {
    return null;
  }
}

interface Props {
  currentMode: ArticleMode;
  altHref: string;
}

export default function ArticleModeMemory({ currentMode, altHref }: Props) {
  const router = useRouter();

  useEffect(() => {
    const saved = getArticleMode();
    if (saved && saved !== currentMode) {
      router.replace(altHref);
    }
  }, [currentMode, altHref, router]);

  return null;
}
