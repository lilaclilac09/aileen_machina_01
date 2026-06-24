/**
 * Shared types for the research magazine rack. Every issue file imports
 * MagazineIssue from here; the shared ResearchBook component consumes it.
 */

export type ImpactDirection = 'reinforces' | 'weakens' | 'uncertain';
export type Stance = 'bullish' | 'bearish' | 'wait';
export type Confidence = 'high' | 'medium' | 'low';

export type MagazineCard = {
  id: string;
  title: string;
  scene: string;
  judgment: string;
  points: string[];
  impact: ImpactDirection;
  impactNote: string;
  drawer?: {
    sources?: string[];
    quotes?: { who: string; text: string }[];
    math?: string;
  };
};

export type MagazineColumn = {
  id: string;
  label: string;
  tagline: string;
  cards: MagazineCard[];
};

export type Verdict = {
  stance: Stance;
  stanceText: string;
  confidence: Confidence;
  confidenceNote: string;
  reasons: string[];
  biggestCounter: string;
  indicators: string[];
  timeWindow: string;
};

export type MagazineIssue = {
  slug: string;
  issueNumber: string;
  coverScene: string;
  coverTitle: string;
  coverQuestion: string;
  /** Editorial line — why this issue exists. Renders after the cover. */
  whyThisIssue: string;
  columns: MagazineColumn[];
  verdict: Verdict;
  /** Editorial line — what the next issue tracks. Renders in the verdict. */
  nextIssueTracks: string;
};
