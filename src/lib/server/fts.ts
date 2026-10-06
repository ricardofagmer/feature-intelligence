/**
 * FTS5 query builders. User and model text never reaches MATCH raw: it is
 * reduced to letter/digit tokens and each token is double-quoted, so FTS5
 * operators (NEAR, OR, -, *, column filters) in the input are inert.
 */

const MAX_QUERY_TOKENS = 40;

// High-frequency words that would make an OR-query match nearly every row.
const STOPWORDS: ReadonlySet<string> = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "would", "should",
  "could", "when", "what", "which", "into", "our", "are", "not", "can", "but",
  "all", "any", "was", "were", "been", "will", "they", "them", "their", "there",
  "then", "than", "also", "just", "like", "want", "need", "able", "some", "more",
  "very", "you", "your", "its", "has", "had", "too", "out", "use", "using",
]);

function tokenize(text: string, minLength: number): string[] {
  const unique = new Set<string>();
  for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (word.length >= minLength && !STOPWORDS.has(word)) {
      unique.add(word);
    }
    if (unique.size >= MAX_QUERY_TOKENS) break;
  }
  return [...unique];
}

/** OR-query for duplicate candidate retrieval; null when the text has no usable keywords. */
export function buildCandidateQuery(title: string, description: string): string | null {
  const tokens = tokenize(`${title} ${description}`, 3);
  return tokens.length > 0 ? tokens.map((token) => `"${token}"`).join(" OR ") : null;
}

/** AND-of-prefixes query for board search; null when the search box has no usable keywords. */
export function buildSearchQuery(text: string): string | null {
  const tokens = tokenize(text, 2);
  return tokens.length > 0 ? tokens.map((token) => `"${token}"*`).join(" ") : null;
}
