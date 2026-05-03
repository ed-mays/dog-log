/**
 * Deterministic mapping from a task's `Verify:` line to a canonical pnpm
 * command. Replaces the LLM-derivation block in builder.md (round 27 cost:
 * $0.71 invented Jest --testPathPattern syntax on a Vitest project).
 *
 * Two-stage derivation:
 *   1. If the verify line backtick-fences a `pnpm ...` command, return it
 *      verbatim — the spec author has already chosen the canonical form.
 *   2. Otherwise scan the verify line for keywords (rules, lint, build,
 *      typecheck, integration, ...) and map to the closest existing script
 *      in the project's package.json. Default: test:unit (or whichever
 *      test-like script is present).
 *
 * Pure: takes the verify line + a parsed package.json scripts map, returns
 * a plain object. The caller handles file I/O.
 */

export type DerivedVerifyCommandSource =
  | 'verbatim'
  | 'script-match'
  | 'descriptive-default'
  | 'unknown';

export interface DerivedVerifyCommand {
  /** The canonical command string, or null when no command can be derived. */
  command: string | null;
  source: DerivedVerifyCommandSource;
  /** Short explanation suitable for inclusion in the builder input. */
  reason: string;
}

export interface PackageJsonLike {
  scripts?: Record<string, string | undefined>;
}

/** Match any backtick-fenced `pnpm ...` command. */
const PNPM_BACKTICK_RE = /`(pnpm\s+[^`]+)`/i;

/**
 * Ordered keyword → preferred script lookup. First match wins. Each entry
 * lists candidate script names in priority order; we return the first one
 * present in package.json.scripts.
 */
const KEYWORD_RULES: Array<{ keyword: RegExp; scripts: string[] }> = [
  { keyword: /\brules\b/i, scripts: ['test:rules'] },
  { keyword: /\bintegration\b/i, scripts: ['test:integration'] },
  { keyword: /\blint\b/i, scripts: ['lint'] },
  {
    keyword: /\btypecheck\b|\btsc\b|\btypes?\s+compile/i,
    scripts: ['typecheck', 'preflight'],
  },
  { keyword: /\bbuild\b/i, scripts: ['preflight', 'build'] },
];

/** Test-like scripts to use as the default fallback, in priority order. */
const DEFAULT_TEST_SCRIPTS = ['test:unit', 'test'];

function hasScript(pkg: PackageJsonLike, name: string): boolean {
  const scripts = pkg.scripts;
  if (!scripts) return false;
  return typeof scripts[name] === 'string' && scripts[name]!.length > 0;
}

function pickFirstPresent(
  pkg: PackageJsonLike,
  candidates: string[]
): string | null {
  for (const name of candidates) {
    if (hasScript(pkg, name)) return name;
  }
  return null;
}

export function deriveVerifyCommand(
  verifyLine: string | null,
  pkg: PackageJsonLike
): DerivedVerifyCommand {
  if (!verifyLine || !verifyLine.trim()) {
    return {
      command: null,
      source: 'unknown',
      reason: 'verify line is empty or null',
    };
  }

  // Stage 1: verbatim backticked pnpm command.
  const verbatim = verifyLine.match(PNPM_BACKTICK_RE);
  if (verbatim) {
    const command = verbatim[1]!.trim();
    return {
      command,
      source: 'verbatim',
      reason: `extracted verbatim from backtick-fenced \`${command}\` in the verify line`,
    };
  }

  // Stage 2: keyword → script lookup.
  for (const rule of KEYWORD_RULES) {
    if (rule.keyword.test(verifyLine)) {
      const script = pickFirstPresent(pkg, rule.scripts);
      if (script) {
        return {
          command: `pnpm run ${script}`,
          source: 'script-match',
          reason: `verify line keyword matched /${rule.keyword.source}/; package.json defines '${script}'`,
        };
      }
    }
  }

  // Default: pick the best test-like script.
  const fallback = pickFirstPresent(pkg, DEFAULT_TEST_SCRIPTS);
  if (fallback) {
    return {
      command: `pnpm run ${fallback}`,
      source: 'descriptive-default',
      reason: `descriptive verify line; defaulted to project's '${fallback}' script`,
    };
  }

  return {
    command: null,
    source: 'unknown',
    reason:
      'no test-like script found in package.json; cannot derive a default',
  };
}
