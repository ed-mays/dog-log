/**
 * Validates that a git commit message cites at least one spec-anchored
 * reference, OR is explicitly exempt.
 *
 * Methodology rule (from the architecture plan §1):
 *   "regex over commit message must match (BR|NFR|AC|US)-\\d+|§\\d+|§D\\d+.
 *    Hard fail if absent."
 *
 * In practice we accept a slightly broader set:
 *   - typed refs:     BR-N, NFR-N, AC-N, US-N, OQ-N, DQ-N
 *   - section refs:   §N (spec) and §DN (design)
 *   - task refs:      T-N — for process tasks (T-43/46/47 cite docs not §)
 *
 * Exempt commit subjects:
 *   - merge subjects     ("Merge ...")
 *   - revert subjects    ("Revert ...")
 *   - configurable type  prefixes (default: chore, style, ci, build)
 *   - configurable scope prefixes (default: harness — tooling itself)
 *   - any commit containing the token [skip-cite] anywhere in its body
 *
 * Pure: takes a string, returns a typed result. No I/O. No project imports.
 * Extraction-ready for the future spec-scaffolder tool.
 */

export interface CitationLinterConfig {
  /** Conventional-commit types whose commits skip the citation rule. */
  exemptTypes: string[];
  /** Conventional-commit scopes whose commits skip the citation rule. */
  exemptScopes: string[];
}

export const DEFAULT_CONFIG: CitationLinterConfig = {
  exemptTypes: ['chore', 'style', 'ci', 'build'],
  exemptScopes: ['harness'],
};

export interface LintResult {
  valid: boolean;
  /** Distinct citation tokens found in the message (subject + body). */
  citations: string[];
  /** Subject line as parsed (first non-empty, non-comment line). */
  subject: string | null;
  /** Set when the message is exempt from the citation rule; explains why. */
  exemptReason: string | null;
  /** Set when the message is invalid; explains how to fix. */
  failureReason: string | null;
}

const MERGE_RE = /^Merge\s/;
const REVERT_RE = /^Revert\s/;
/**
 * Anchored to the start of a line so it cannot match inside documentation
 * or quoted help text. Optional `:reason` suffix is recorded only as a
 * convention; not required for the match.
 */
const SKIP_TOKEN_RE = /^\[skip-cite(?::[^\]]*)?]/m;

/** Conventional-commit prefix: `type(scope)?(!)?: subject`. Captures type, scope. */
const CC_PREFIX = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?!?:\s/;

const TYPED_CITATION = /\b(?:BR|NFR|AC|US|OQ|DQ|T)-\d+\b/g;
const SECTION_CITATION = /§D?\d+\b/g;

/**
 * Lints a full commit message string.
 *
 * Treats lines starting with `#` as git editor comments and ignores them.
 * The "subject" is the first non-empty, non-comment line.
 */
export function lintCommitMessage(
  raw: string,
  config: CitationLinterConfig = DEFAULT_CONFIG
): LintResult {
  const cleaned = raw
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');

  const subject =
    cleaned
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? null;

  if (subject === null) {
    return {
      valid: false,
      citations: [],
      subject: null,
      exemptReason: null,
      failureReason: 'commit message is empty',
    };
  }

  if (MERGE_RE.test(subject)) {
    return {
      valid: true,
      citations: extractCitations(cleaned),
      subject,
      exemptReason: 'merge commit',
      failureReason: null,
    };
  }

  if (REVERT_RE.test(subject)) {
    return {
      valid: true,
      citations: extractCitations(cleaned),
      subject,
      exemptReason: 'revert commit',
      failureReason: null,
    };
  }

  const cc = CC_PREFIX.exec(subject)?.groups ?? {};
  const type = cc['type']?.toLowerCase();
  const scope = cc['scope']?.toLowerCase();

  if (type && config.exemptTypes.includes(type)) {
    return {
      valid: true,
      citations: extractCitations(cleaned),
      subject,
      exemptReason: `exempt commit type '${type}'`,
      failureReason: null,
    };
  }

  if (scope && config.exemptScopes.includes(scope)) {
    return {
      valid: true,
      citations: extractCitations(cleaned),
      subject,
      exemptReason: `exempt commit scope '${scope}'`,
      failureReason: null,
    };
  }

  // Power-user escape hatch — checked AFTER scope/type so that legitimate
  // exempt commits get the right reason, AND anchored to the start of a line
  // so it cannot match inside documentation or quoted help text.
  if (SKIP_TOKEN_RE.test(cleaned)) {
    return {
      valid: true,
      citations: extractCitations(cleaned),
      subject,
      exemptReason: "contains '[skip-cite]' marker (start of line)",
      failureReason: null,
    };
  }

  const citations = extractCitations(cleaned);
  if (citations.length === 0) {
    return {
      valid: false,
      citations: [],
      subject,
      exemptReason: null,
      failureReason: buildFailureReason(subject, config),
    };
  }

  return {
    valid: true,
    citations,
    subject,
    exemptReason: null,
    failureReason: null,
  };
}

function extractCitations(message: string): string[] {
  const found = new Set<string>();
  for (const m of message.matchAll(TYPED_CITATION)) found.add(m[0]);
  for (const m of message.matchAll(SECTION_CITATION)) found.add(m[0]);
  return Array.from(found).sort();
}

function buildFailureReason(
  subject: string,
  config: CitationLinterConfig
): string {
  const typesList = config.exemptTypes.join(', ');
  const scopesList = config.exemptScopes.join(', ');
  return [
    `no spec-anchored citation found in commit message`,
    `subject: ${subject}`,
    ``,
    `Acceptable citation forms (any one):`,
    `  - Typed refs:    BR-N, NFR-N, AC-N, US-N, OQ-N, DQ-N, T-N`,
    `  - Sections:      §N (spec), §DN (design)`,
    ``,
    `If this commit doesn't trace to a spec section, you can:`,
    `  - Use an exempt type:      ${typesList}`,
    `  - Use an exempt scope:     ${scopesList}`,
    `  - Start a line with the [skip-cite] marker`,
  ].join('\n');
}
