class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  static getInstance() {
    if (!LoggerService.instance) LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }

  shouldLog = () => {
    return process.env.NODE_ENV === 'production';
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
