/**
 * Extracts cited regions (whole sections, individual requirements) from a
 * spec or design markdown file.
 *
 * Inputs are the raw markdown strings; outputs are plain strings ready to
 * paste into a builder-agent prompt. Pure: no I/O, no project imports.
 *
 * Spec sections are headed `## §N <name>` (or `## §DN <name>` for design).
 * Requirements are list bullets starting with `- **BR-N**`, `- **AC-N**`, etc.
 *
 * Tombstoned requirements (e.g. `**AC-14 (tombstoned ...)**`) ARE returned
 * if explicitly requested — callers decide whether to surface them. The
 * default `extractRequirement()` includes them; `excludeTombstones` filters.
 */

export interface SpecParserOptions {
  /** When true, throw if the requested ref isn't found. Default false (returns null). */
  required?: boolean;
}

const SECTION_HEADING_RE = /^##\s+(§D?\d+)\b/;

/**
 * Extract a whole section by ref, e.g. `§5` (spec) or `§D3` (design).
 * Returns the heading + all body content up to (but not including) the next
 * `## ` heading. Returns `null` if not found and `required: false`.
 */
export function extractSpecSection(
  markdown: string,
  ref: string,
  opts: SpecParserOptions = {}
): string | null {
  const lines = markdown.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = SECTION_HEADING_RE.exec(lines[i]!);
    if (m && m[1] === ref) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) {
    if (opts.required) throw new Error(`spec section ${ref} not found`);
    return null;
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith('## ')) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx, endIdx).join('\n').trim();
}

/**
 * Extract a single requirement bullet by ref (BR-N, AC-N, NFR-N, US-N, OQ-N, DQ-N).
 * Captures the bullet's first line plus any indented continuation lines.
 *
 * Returns null if the ref isn't present and `required: false`.
 */
export function extractRequirement(
  markdown: string,
  ref: string,
  opts: SpecParserOptions = {}
): string | null {
  // Match `- **<REF>` (with optional trailing parenthetical: `- **AC-1 (US-1, BR-1)**`).
  const refEscaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bulletRe = new RegExp(`^-\\s+\\*\\*${refEscaped}\\b`);

  const lines = markdown.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (bulletRe.test(lines[i]!)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) {
    if (opts.required) throw new Error(`requirement ${ref} not found`);
    return null;
  }

  // Continuation: subsequent lines that are blank, indented, or start with a
  // sub-bullet ("  - ..."). Stop at the next top-level bullet or heading.
  let endIdx = startIdx + 1;
  while (endIdx < lines.length) {
    const line = lines[endIdx]!;
    if (line.startsWith('## ') || line.startsWith('### ')) break;
    // Top-level bullet (- foo or * foo) at column 0 ends the previous bullet.
    if (/^[-*]\s/.test(line)) break;
    endIdx += 1;
  }

  return lines.slice(startIdx, endIdx).join('\n').trimEnd();
}

/**
 * Extract many requirements at once, keeping order and skipping refs not found.
 * Each entry is `{ ref, body }`.
 */
export function extractRequirements(
  markdown: string,
  refs: string[]
): Array<{ ref: string; body: string }> {
  const out: Array<{ ref: string; body: string }> = [];
  for (const ref of refs) {
    const body = extractRequirement(markdown, ref);
    if (body !== null) out.push({ ref, body });
  }
  return out;
}

/**
 * Extract many sections at once. Skips refs not found.
 */
export function extractSpecSections(
  markdown: string,
  refs: string[]
): Array<{ ref: string; body: string }> {
  const out: Array<{ ref: string; body: string }> = [];
  for (const ref of refs) {
    const body = extractSpecSection(markdown, ref);
    if (body !== null) out.push({ ref, body });
  }
  return out;
}
