import type { Product } from "@shared/types/product";

// Normalize a string: lowercase, replace non-alphanum with spaces, collapse spaces
export const normalize = (s: string | undefined): string =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

// Basic stopwords to ignore from casual queries like "show me" etc.
export const STOPWORDS = new Set([
  "show",
  "me",
  "find",
  "finds",
  "please",
  "items",
  "item",
  "matching",
  "the",
  "a",
  "an",
  "for",
]);

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t));
}

// Core filter function used by both the REST API and AI tool wrappers
export function filterProductsByQuery(all: Product[], query: string): Product[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return all.slice();

  return all.filter((p: Product) => {
    const hay = normalize([p.name, p.description, p.category].filter(Boolean).join(" "));
    // every token must appear in the haystack (allow simple plural match)
    return tokens.every((tok) => {
      if (!tok) return true;
      if (hay.includes(tok)) return true;
      // naive plural handling: if token ends with 's', try without it
      if (tok.endsWith("s") && hay.includes(tok.slice(0, -1))) return true;
      return false;
    });
  });
}
