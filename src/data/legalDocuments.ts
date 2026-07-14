/** Mobil legal slug → tam metin (web `src/data/legal`). */

import { LEGAL_DOCUMENTS } from './legal/index.js';

export type LegalDocument = {
  slug: string;
  title: string;
  updatedAt: string;
  sections: { heading: string; body: string }[];
};

type LegalSource = {
  slug: string;
  title: string;
  updatedAt: string;
  sections: { heading: string; body: string }[];
};

const DOCS = LEGAL_DOCUMENTS as Record<string, LegalSource>;

export const LEGAL_SLUGS = Object.keys(DOCS);

export function getLegalDocument(slug: string): LegalDocument | null {
  const doc = DOCS[slug];
  if (!doc) return null;
  return {
    slug: doc.slug || slug,
    title: doc.title,
    updatedAt: doc.updatedAt,
    sections: doc.sections || [],
  };
}
