import { describe, it, expect } from 'vitest';
import {
  extractFencedBlock,
  parseFlatYaml,
  parseStructuredExit,
  tryParseJson,
} from './parse-structured-exit';

describe('extractFencedBlock', () => {
  it('extracts a json fenced block', () => {
    const text = 'preamble\n```json\n{"a":1}\n```\nepilogue';
    expect(extractFencedBlock(text)).toEqual({
      format: 'json',
      body: '{"a":1}',
    });
  });

  it('extracts a yaml fenced block when no json present', () => {
    const text = '```yaml\nstatus: success\n```';
    expect(extractFencedBlock(text)).toEqual({
      format: 'yaml',
      body: 'status: success',
    });
  });

  it('prefers json when both present', () => {
    const text = '```yaml\nfoo: 1\n```\n```json\n{"b":2}\n```';
    expect(extractFencedBlock(text)).toEqual({
      format: 'json',
      body: '{"b":2}',
    });
  });

  it('returns null when no fence', () => {
    expect(extractFencedBlock('just prose, no fence')).toBeNull();
  });
});

describe('tryParseJson', () => {
  it('parses valid JSON', () => {
    expect(tryParseJson('{"x":1}')).toEqual({ x: 1 });
  });

  it('returns null on invalid JSON', () => {
    expect(tryParseJson('{not json}')).toBeNull();
  });
});

describe('parseFlatYaml', () => {
  it('parses simple key: value', () => {
    const y = `status: success\ncommit_sha: abc123`;
    expect(parseFlatYaml(y)).toEqual({
      status: 'success',
      commit_sha: 'abc123',
    });
  });

  it('parses block scalars (|)', () => {
    const y = `status: spec_gap\ngap_description: |\n  This is a multi-line\n  description.\nsuggested_amendment: |\n  one line`;
    const parsed = parseFlatYaml(y);
    expect(parsed.status).toBe('spec_gap');
    expect(parsed.gap_description).toBe('This is a multi-line\ndescription.');
    expect(parsed.suggested_amendment).toBe('one line');
  });

  it('parses lists', () => {
    const y = `status: success\nfiles_touched:\n  - src/a.ts\n  - src/b.ts`;
    const parsed = parseFlatYaml(y);
    expect(parsed.status).toBe('success');
    expect(parsed.files_touched).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('parses nested maps', () => {
    const y = `status: success\nverify_run:\n  typecheck: pass\n  lint: pass\n  test: pass`;
    const parsed = parseFlatYaml(y);
    expect(parsed.verify_run).toEqual({
      typecheck: 'pass',
      lint: 'pass',
      test: 'pass',
    });
  });

  it('strips wrapping quotes on string values', () => {
    expect(parseFlatYaml('a: "hello"\nb: \'world\'')).toEqual({
      a: 'hello',
      b: 'world',
    });
  });
});

describe('parseStructuredExit', () => {
  it('returns parsed JSON from a fenced json block', () => {
    const text =
      'sure, here it is:\n```json\n{"verdict":"approve","findings":[]}\n```';
    expect(parseStructuredExit(text)).toEqual({
      verdict: 'approve',
      findings: [],
    });
  });

  it('returns parsed YAML when only YAML fence present', () => {
    const text = '```yaml\nstatus: success\ncommit_sha: abc\n```';
    expect(parseStructuredExit(text)).toEqual({
      status: 'success',
      commit_sha: 'abc',
    });
  });

  it('falls back to bare JSON when no fence', () => {
    const text = '{"status":"verify_fail","attempts":2}';
    expect(parseStructuredExit(text)).toEqual({
      status: 'verify_fail',
      attempts: 2,
    });
  });

  it('returns the YAML structure for bare YAML when no fence and not JSON', () => {
    const text = 'status: success\ncommit_sha: deadbeef';
    expect(parseStructuredExit(text)).toEqual({
      status: 'success',
      commit_sha: 'deadbeef',
    });
  });
});
