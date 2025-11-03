class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  static getInstance() {
    if (!LoggerService.instance) LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }

  shouldLog = () => {
    // Determine Node-style env first (to allow tests to simulate production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeEnv = (globalThis as any)?.process?.env?.NODE_ENV as
      | string
      | undefined;
    if (nodeEnv === 'production') return false;

    // Prefer Vite's flags when available (works in dev and vitest)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viteProd = (import.meta as any)?.env?.PROD;
      if (typeof viteProd === 'boolean') return !viteProd; // log unless production build
    } catch {
      // ignore if import.meta is not available
    }

    // Fallback to Node-style semantics
    return nodeEnv !== 'production';
  };

  info(message: string, context?: object) {
    if (!this.shouldLog()) return;
    console.info(`[INFO] ${new Date().toISOString()}`, message, context || '');
  }

  error(message: string, context?: object) {
    if (!this.shouldLog()) return;
    console.error(
      `[ERROR] ${new Date().toISOString()}`,
      message,
      context || ''
    );
  }
}

export const logger = LoggerService.getInstance();
