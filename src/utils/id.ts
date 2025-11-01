// Robust ID generation with test-time override
// Runtime default: crypto.randomUUID when available; otherwise a random fallback
// Tests can inject a deterministic generator via setIdGenerator

export type IdGenerator = () => string;

function defaultIdGenerator(): string {
  const rnd = (len = 8) =>
    Math.random()
      .toString(36)
      .slice(2, 2 + len);
  const hasUUID = (
    globalThis as unknown as { crypto?: { randomUUID?: () => string } }
  ).crypto?.randomUUID;
  if (hasUUID) {
    return (
      globalThis as unknown as { crypto: { randomUUID: () => string } }
    ).crypto.randomUUID();
  }
  return `${rnd(8)}-${rnd(4)}-${rnd(4)}-${rnd(4)}-${rnd(12)}`;
}

let currentGenerator: IdGenerator = defaultIdGenerator;

export function setIdGenerator(fn: IdGenerator) {
  currentGenerator = fn;
}

export function resetIdGenerator() {
  currentGenerator = defaultIdGenerator;
}

export function generateId(): string {
  return currentGenerator();
}
