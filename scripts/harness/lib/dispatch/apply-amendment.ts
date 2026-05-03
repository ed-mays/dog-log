/**
 * Apply an arbiter amendment to a spec/design/task file.
 *
 * The amendment is a deterministic before/after substring substitution plus
 * a changelog entry append. Pre-apply guard: `before` MUST appear exactly
 * once in the file. If it doesn't (whitespace drift, prior overlapping
 * amendment, ambiguous match), the function returns an error and the
 * orchestrator halts for human intervention.
 *
 * Changelog routing:
 *   01-spec.md   → §10 Spec Changelog
 *   02-design.md → §D11 Design Changelog
 *   03-tasks.md  → §T0 Tasks Changelog
 *
 * If the changelog block can't be located, the entry is appended at EOF
 * with a warning, and the result records `changelog_appended_at_eof: true`.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import type { ArbiterAmendment } from './arbiter-dispatch';

export interface ApplyAmendmentResult {
  ok: boolean;
  /** Absolute path written. */
  filePath?: string;
  /** Why the apply failed (when ok=false). */
  error?: string;
  /** True when the changelog landed at EOF rather than the canonical block. */
  changelog_appended_at_eof?: boolean;
  /** True when amendment.before was empty (pure addition); applied at EOF of the section. */
  pure_addition?: boolean;
}

const CHANGELOG_HEADERS_BY_FILE: Record<string, string[]> = {
  '01-spec.md': ['## §10 Spec Changelog', '## §10', '## §10 Changelog'],
  '02-design.md': ['## §D11 Design Changelog', '## §D11'],
  '03-tasks.md': ['## §T0 Tasks Changelog', '## §T0'],
};

export function applyAmendment(
  amendment: ArbiterAmendment,
  opts: { repoRoot?: string; specDir?: string } = {}
): ApplyAmendmentResult {
  const repoRoot = opts.repoRoot ?? process.cwd();
  const specDir =
    opts.specDir ?? resolve(repoRoot, 'docs/specs/incident-capture');
  const filePath = resolve(specDir, amendment.file);

  if (!existsSync(filePath)) {
    return {
      ok: false,
      error: `apply-amendment: file not found at ${filePath}`,
    };
  }

  const original = readFileSync(filePath, 'utf8');

  let updated: string;
  if (amendment.before === '') {
    // Pure addition — append to anchor section is ambiguous without an
    // explicit insertion point. v1: refuse pure-addition amendments and
    // require the arbiter to send a non-empty `before`. (The arbiter's
    // current prompt does emit non-empty `before` in practice.)
    return {
      ok: false,
      error:
        'apply-amendment: pure additions (empty `before`) are not supported in v1; arbiter must include a non-empty before string',
    };
  } else {
    const matches = countOccurrences(original, amendment.before);
    if (matches === 0) {
      return {
        ok: false,
        error: `apply-amendment: amendment.before not found in ${basename(filePath)}. Likely cause: whitespace drift or prior overlapping amendment.`,
      };
    }
    if (matches > 1) {
      return {
        ok: false,
        error: `apply-amendment: amendment.before matches ${matches} times in ${basename(filePath)}; ambiguous. Arbiter must send a more specific anchor.`,
      };
    }
    updated = original.replace(amendment.before, amendment.after);
  }

  const changelogResult = appendChangelogEntry(
    updated,
    amendment.file,
    amendment.changelog_entry
  );
  updated = changelogResult.text;

  writeFileSync(filePath, updated, 'utf8');
  return {
    ok: true,
    filePath,
    changelog_appended_at_eof: changelogResult.appendedAtEof,
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count += 1;
    idx += needle.length;
  }
  return count;
}

function appendChangelogEntry(
  fileText: string,
  fileBasename: string,
  entry: string
): { text: string; appendedAtEof: boolean } {
  const headers = CHANGELOG_HEADERS_BY_FILE[fileBasename] ?? [];
  for (const header of headers) {
    const idx = fileText.indexOf(header);
    if (idx !== -1) {
      // Append the entry as a new bullet line at the END of the changelog
      // block. The block is everything from the header to the next H2 or EOF.
      const afterHeader = idx + header.length;
      const nextH2 = fileText.indexOf('\n## ', afterHeader);
      const blockEnd = nextH2 === -1 ? fileText.length : nextH2;
      const block = fileText.slice(afterHeader, blockEnd);
      // Trim trailing whitespace from the block and append the entry.
      const trimmedBlock = block.replace(/\s+$/, '');
      const newBlock = `${trimmedBlock}\n- ${entry}\n`;
      return {
        text:
          fileText.slice(0, afterHeader) + newBlock + fileText.slice(blockEnd),
        appendedAtEof: false,
      };
    }
  }
  // Fallback: append at EOF with a warning marker.
  return {
    text:
      fileText.replace(/\s*$/, '') +
      `\n\n<!-- changelog block not found -->\n- ${entry}\n`,
    appendedAtEof: true,
  };
}
