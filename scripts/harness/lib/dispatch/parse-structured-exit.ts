/**
 * Parse a subagent's final text response into a structured exit payload.
 *
 * Builder, cold-reader, and arbiter prompts all instruct the subagent to
 * emit a structured exit (JSON or, for builder, optionally YAML). This
 * parser is permissive about wrapping (fenced code block or bare) and
 * format (prefers JSON; falls back to a minimal flat-key YAML reader).
 *
 * Returns `null` when nothing parseable is found — callers decide whether
 * that's a failure or a permission to fall back.
 */

export function extractFencedBlock(
  text: string,
  prefer: ('json' | 'yaml')[] = ['json', 'yaml']
): { format: 'json' | 'yaml'; body: string } | null {
  for (const lang of prefer) {
    const re = new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)\\n\\s*```', 'i');
    const m = re.exec(text);
    if (m && m[1] !== undefined) {
      return { format: lang, body: m[1].trim() };
    }
  }
  return null;
}

export function tryParseJson<T = unknown>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

/**
 * Minimal flat-key YAML parser for the known exit shapes:
 *   key: value
 *   key: |
 *     multi-line value
 *   key:
 *     - list item
 *     - list item
 *   key:
 *     nested_key: value
 *
 * Not a full YAML parser. Just enough for builder/cold-reader/arbiter exits.
 * Returns a plain object with string / string[] / nested-object values.
 */
export function parseFlatYaml(body: string): Record<string, unknown> {
  const lines = body.split('\n');
  const result: Record<string, unknown> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    if (indent !== 0 || line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1]!;
    const inlineValue = m[2]!.trim();
    if (inlineValue === '|' || inlineValue === '>') {
      // Block scalar — collect indented continuation.
      const block: string[] = [];
      i++;
      while (i < lines.length) {
        const next = lines[i]!;
        const nextIndent = next.match(/^ */)?.[0].length ?? 0;
        if (next.trim() === '' && i + 1 < lines.length) {
          block.push('');
          i++;
          continue;
        }
        if (nextIndent < 2) break;
        block.push(next.slice(2));
        i++;
      }
      result[key] = block.join('\n').trim();
      continue;
    }
    if (inlineValue === '') {
      // Either a list or a nested map starting on next lines.
      const block: string[] = [];
      const nested: Record<string, string> = {};
      i++;
      let mode: 'list' | 'map' | 'unknown' = 'unknown';
      while (i < lines.length) {
        const next = lines[i]!;
        const nextIndent = next.match(/^ */)?.[0].length ?? 0;
        if (next.trim() === '') {
          i++;
          continue;
        }
        if (nextIndent === 0) break;
        const stripped = next.trim();
        if (stripped.startsWith('-')) {
          mode = 'list';
          block.push(stripped.slice(1).trim());
        } else {
          const sub = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(stripped);
          if (sub) {
            mode = 'map';
            nested[sub[1]!] = sub[2]!.trim();
          }
        }
        i++;
      }
      if (mode === 'list') {
        result[key] = block;
      } else if (mode === 'map') {
        result[key] = nested;
      } else {
        result[key] = '';
      }
      continue;
    }
    result[key] = stripQuotes(inlineValue);
    i++;
  }
  return result;
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Top-level extractor: finds a fenced JSON or YAML block and returns the
 * parsed structured exit. Falls back to parsing the entire text as JSON
 * (then bare YAML) if no fence is found.
 */
export function parseStructuredExit<T = Record<string, unknown>>(
  text: string
): T | null {
  const fenced = extractFencedBlock(text);
  if (fenced) {
    if (fenced.format === 'json') {
      const parsed = tryParseJson<T>(fenced.body);
      if (parsed !== null) return parsed;
    }
    if (fenced.format === 'yaml') {
      return parseFlatYaml(fenced.body) as T;
    }
  }
  const bareJson = tryParseJson<T>(text.trim());
  if (bareJson !== null) return bareJson;
  // Last resort: try YAML on the whole text.
  return parseFlatYaml(text) as T;
}
