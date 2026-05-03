/**
 * Deterministic pre-flight check that lifts cold-reader scope #7
 * (task-contract conformance) from LLM judgment to mechanical derivation.
 *
 * Mechanism:
 *   1. Extract backtick-quoted tokens from the task `What:` line.
 *   2. Classify each as 'path' or 'identifier'; strip method-call parens.
 *   3. Search the unified diff for each symbol (word-boundary for identifiers,
 *      literal substring for paths).
 *   4. Return present + missing partitions, with first-line evidence for
 *      present symbols.
 *
 * The orchestrator runs this between builder success and cold-reader dispatch
 * and injects the result into the cold-reader input. The cold-reader still
 * makes the judgment call on whether a missing symbol matters — but it
 * receives authoritative pre-flagged data rather than re-deriving it.
 *
 * Pure: no I/O, no project imports.
 */

export type SymbolKind = 'path' | 'identifier';

export interface ExtractedSymbol {
  symbol: string;
  kind: SymbolKind;
}

export interface CheckedSymbol extends ExtractedSymbol {
  present: boolean;
  /** First diff line (trimmed) where the symbol matches; null if absent. */
  evidence: string | null;
}

export interface TaskContractCheckResult {
  symbols: CheckedSymbol[];
  present: CheckedSymbol[];
  missing: CheckedSymbol[];
}

/** Backtick-quoted tokens. Non-greedy, no nested backticks. */
const BACKTICK_TOKEN = /`([^`\n]+)`/g;

/** Citation refs we always skip — these are never code symbols. */
const CITATION_RE = /^(?:BR|NFR|AC|US|OQ|DQ)-\d+$|^§D?\d+/i;

/** A token is a "path" if it contains a slash OR a dot followed by letters. */
function classify(symbol: string): SymbolKind {
  if (symbol.includes('/')) return 'path';
  if (/\.[A-Za-z]/.test(symbol)) return 'path';
  return 'identifier';
}

/** Strip trailing `(...)` from a method-call-style backtick token. */
function stripCallParens(token: string): string {
  return token.replace(/\([^)]*\)\s*$/, '');
}

/**
 * Pull named symbols out of a `What:` line. Skips citations, multi-word
 * tokens (prose), and anything that doesn't look like a code identifier or
 * path. Dedupes by symbol name.
 */
export function extractTaskWhatSymbols(what: string | null): ExtractedSymbol[] {
  if (!what) return [];
  const seen = new Set<string>();
  const out: ExtractedSymbol[] = [];
  for (const match of what.matchAll(BACKTICK_TOKEN)) {
    const raw = match[1]!.trim();
    if (!raw) continue;
    const stripped = stripCallParens(raw).trim();
    if (!stripped) continue;
    if (stripped.includes(' ')) continue; // prose
    if (CITATION_RE.test(stripped)) continue;
    if (seen.has(stripped)) continue;
    seen.add(stripped);
    out.push({ symbol: stripped, kind: classify(stripped) });
  }
  return out;
}

/**
 * Escape a string for safe use inside a RegExp. (No `RegExp.escape` in TS yet.)
 */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the first diff line containing the symbol. For identifiers we use
 * word-boundary matching to avoid `Severityish` matching `Severity`. For
 * paths we use literal substring (paths often contain `/` and `.` which
 * complicate word boundaries).
 */
function findEvidence(
  symbol: string,
  kind: SymbolKind,
  diff: string
): string | null {
  const escaped = escapeRe(symbol);
  const re =
    kind === 'identifier'
      ? new RegExp(`\\b${escaped}\\b`)
      : new RegExp(escaped);
  for (const line of diff.split('\n')) {
    if (re.test(line)) return line.trim();
  }
  return null;
}

export function checkTaskContract(
  what: string | null,
  diff: string
): TaskContractCheckResult {
  const symbols = extractTaskWhatSymbols(what);
  const checked: CheckedSymbol[] = symbols.map((s) => {
    const evidence = findEvidence(s.symbol, s.kind, diff);
    return { ...s, present: evidence !== null, evidence };
  });
  return {
    symbols: checked,
    present: checked.filter((s) => s.present),
    missing: checked.filter((s) => !s.present),
  };
}
